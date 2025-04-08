
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  if (!base64String) {
    throw new Error('No base64 string provided');
  }
  
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Function to analyze food images using AI Vision API
async function analyzeFoodImage(imageBase64: string) {
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!openAIApiKey) {
    throw new Error('AI vision API key not configured on server');
  }
  
  // Remove potential data URL prefix
  const base64Data = imageBase64.includes('base64,') 
    ? imageBase64.split('base64,')[1] 
    : imageBase64;
  
  console.log(`Analyzing food image (base64 length: ${base64Data.length.toString()})...`);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIApiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a nutritional analysis AI. Analyze the food in the image and provide detailed nutritional information in JSON format. Include: name, calories, protein (g), carbs (g), fat (g), fiber (g), and sugar (g). Be specific about the food item. If you cannot clearly identify the food, make your best educated guess based on visual appearance."
        },
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this food and provide nutritional information in the format: {\"name\": \"Food name\", \"calories\": X, \"protein\": X, \"carbs\": X, \"fat\": X, \"fiber\": X, \"sugar\": X}" 
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Data}`
              }
            }
          ]
        }
      ],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('AI Vision API error:', errorData);
    throw new Error(`AI Vision API error: ${errorData}`);
  }

  const jsonResponse = await response.json();
  
  if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
    throw new Error('Invalid response from AI Vision API');
  }
  
  // Extract the JSON part from the response
  const content = jsonResponse.choices[0].message.content;
  console.log("AI Vision API response:", content);
  
  try {
    // Try to extract JSON from potential text wrapping
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    } else {
      throw new Error('Could not extract JSON from AI Vision response');
    }
  } catch (error) {
    console.error('Error parsing JSON from AI Vision response:', error);
    throw new Error('Failed to parse nutritional data');
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const requestData = await req.json();
    
    // Check for image data
    if (!requestData.image) {
      throw new Error('No image data provided');
    }
    
    const result = await analyzeFoodImage(requestData.image);
    console.log('Analysis result:', result);
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
})
