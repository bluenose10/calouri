
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    console.log("NutriChat function invoked");
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      console.error("AI API key not configured");
      throw new Error('AI API key not configured');
    }
    
    // First try to get the server IP to help with troubleshooting
    let serverIp = "Unknown";
    try {
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      if (ipResponse.ok) {
        const ipData = await ipResponse.json();
        serverIp = ipData.ip;
        console.log(`Server IP address: ${serverIp}`);
      }
    } catch (ipError) {
      console.error("Could not determine server IP:", ipError);
    }
    
    const requestData = await req.json();
    
    // Check if this is an image analysis request
    if (requestData.imageUrl) {
      return await handleImageAnalysis(requestData.imageUrl, apiKey, serverIp, corsHeaders);
    } else {
      // Handle text chat request
      return await handleTextChat(requestData, apiKey, serverIp, corsHeaders);
    }
  } catch (error) {
    console.error('Error in NutriChat function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message || 'An error occurred during the AI request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Function to handle image analysis
async function handleImageAnalysis(imageUrl, apiKey, serverIp, corsHeaders) {
  console.log("Handling image analysis request");
  
  try {
    const startTime = Date.now();
    
    // Enhanced system prompt with focus on food image analysis
    const systemPrompt = `You are a precise nutritional analysis assistant that identifies food in images and provides accurate nutritional information.

CRITICAL INSTRUCTION: Analyze the food image with EXTRA CARE, accounting for potentially lower quality or different lighting conditions.
ALWAYS provide your best analysis even for less-than-perfect images.

Provide your most accurate analysis for:
- Food identification
- Portion size estimation
- Calorie count
- Macronutrient breakdown

If the image is unclear or low quality, make your best estimation based on visible elements.
ALWAYS provide numeric values for all nutritional components.

Respond ONLY with valid JSON - no explanations, no markdown, no code blocks, just pure JSON data.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this food image and provide detailed nutritional information as JSON: {\"name\": \"food name\", \"calories\": number, \"protein\": number, \"carbs\": number, \"fat\": number, \"sugar\": number, \"fiber\": number}. Be extremely precise with your analysis. PROVIDE NUMERIC VALUES FOR ALL NUTRITIONAL FIELDS."
              },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 800, 
        temperature: 0.1
      })
    });
    
    const endTime = Date.now();
    console.log(`AI request completed in ${endTime - startTime}ms`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('AI API error:', errorData);
      throw new Error(`AI API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Try to parse the response as JSON
    const cleanedContent = content.replace(/```json|```/g, '').trim();
    console.log("Cleaned AI content:", cleanedContent);
    
    try {
      const parsedFood = JSON.parse(cleanedContent);
      
      // Enhanced validation with better logging
      if (!parsedFood.name) {
        console.error("Missing food name in AI response");
        throw new Error("Missing food name in AI response");
      }
      
      // Convert all nutritional values to numbers if they're strings
      const nutrientFields = ['calories', 'protein', 'carbs', 'fat', 'sugar', 'fiber'];
      nutrientFields.forEach(field => {
        if (typeof parsedFood[field] === 'string') {
          console.log(`Converting ${field} from string "${parsedFood[field]}" to number`);
          const numValue = parseFloat(parsedFood[field]);
          if (!isNaN(numValue)) {
            parsedFood[field] = numValue;
          } else {
            console.error(`Could not convert ${field} value to number:`, parsedFood[field]);
            // Provide a default value to prevent analysis failure
            parsedFood[field] = 0;
          }
        } else if (typeof parsedFood[field] !== 'number') {
          console.error(`Invalid ${field} value:`, parsedFood[field]);
          // Provide a default value to prevent analysis failure
          parsedFood[field] = 0;
        }
      });
      
      const foodData = {
        id: crypto.randomUUID(),
        name: parsedFood.name,
        calories: parsedFood.calories,
        protein: parsedFood.protein,
        carbs: parsedFood.carbs,
        fat: parsedFood.fat,
        sugar: parsedFood.sugar || 0,
        fiber: parsedFood.fiber || 0,
        imageUrl,
        timestamp: new Date().toISOString(),
        quantity: 1,
        mealType: "lunch",
        notes: ""
      };
      
      return new Response(JSON.stringify({ 
        foodData,
        serverIp
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (error) {
      console.error("Error parsing AI response:", error, "Content:", cleanedContent);
      throw new Error("Failed to parse food data from AI response");
    }
  } catch (error) {
    console.error("Error in image analysis:", error);
    throw error;
  }
}

// Function to handle text chat
async function handleTextChat(requestData, apiKey, serverIp, corsHeaders) {
  const { message, messageHistory } = requestData;
  console.log(`User message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"`);
  console.log(`Message history length: ${messageHistory.length}`);
  
  // Enhanced system message with more nutrition expertise
  const systemMessage = `You are NutriChat, an authoritative nutrition assistant focused on providing accurate, evidence-based information about nutrition, diet, and health. 
  
Your responses should be factual, cite scientific sources when possible, and be tailored to help the user make informed food choices. Focus on nutritional data, dietary guidelines, meal planning, macronutrients, micronutrients, and general food science. 

If asked about food images or analysis results, explain that the app uses advanced AI vision capabilities for nutritional analysis of food images.

Avoid medical diagnoses or treatment recommendations. Keep your responses clear, concise, and educational.`;
  
  // Convert messages to the format expected by API
  const messages = [
    {
      role: "system",
      content: systemMessage
    },
    ...messageHistory.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    {
      role: "user",
      content: message
    }
  ];
  
  console.log("Sending request to AI service");
  const startTime = Date.now();
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 800,
    })
  });
  
  const endTime = Date.now();
  console.log(`AI request completed in ${endTime - startTime}ms`);
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('AI API error:', errorData);
    throw new Error(`AI API error: ${response.status} - ${JSON.stringify(errorData)}`);
  }
  
  const data = await response.json();
  const aiResponse = data.choices[0].message.content;
  console.log(`AI response length: ${aiResponse.length} characters`);
  
  return new Response(JSON.stringify({ 
    response: aiResponse,
    serverIp: serverIp
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}
