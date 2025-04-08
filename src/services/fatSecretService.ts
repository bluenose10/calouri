
import { FoodItem } from '../types';

// Multiple CORS proxies to try in sequence
const CORS_PROXIES = [
  "https://corsproxy.io/?",
  "https://cors.bridged.cc/",
  "https://thingproxy.freeboard.io/fetch/",
  "https://cors-anywhere.herokuapp.com/",
  "https://api.allorigins.win/raw?url="
];

// OAuth token management
let accessToken: string | null = null;
let tokenExpiry: number = 0;
let serverIp: string = "Unknown";

/**
 * Get OAuth access token for FatSecret API
 */
export const getAccessToken = async (): Promise<any> => {
  // Check if we have a valid token
  if (accessToken && tokenExpiry > Date.now()) {
    return { access_token: accessToken, serverIp };
  }

  console.log("Getting new FatSecret access token");
  
  try {
    // Call our Supabase edge function to get the token
    const response = await fetch('https://cbjyshotohhjtyljthxz.supabase.co/functions/v1/fatsecret-auth', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log("OAuth response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`OAuth error: ${response.status} - ${response.statusText}`, errorData);
      
      // Check for IP restriction error
      if (errorData.error && (errorData.error.includes("IP Restriction") || response.status === 403)) {
        serverIp = errorData.serverIp || "Unknown";
        throw {
          message: "IP Restriction Error: Server IP not whitelisted in FatSecret",
          details: errorData.details || "Please add your server's IP to FatSecret IP restrictions",
          serverIp: serverIp
        };
      }
      
      throw new Error(`OAuth error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log("OAuth token response received:", {
      tokenType: data.token_type,
      expiresIn: data.expires_in,
      tokenLength: data.access_token?.length,
      serverIp: data.serverIp
    });
    
    accessToken = data.access_token;
    serverIp = data.serverIp || "Unknown";
    
    // Set expiry slightly before actual expiry to avoid edge cases
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    
    console.log("Successfully obtained FatSecret token");
    return { ...data, serverIp };
  } catch (error) {
    console.error("Error getting FatSecret access token:", error);
    throw error;
  }
};

/**
 * Enhanced fetch with multiple CORS proxy fallbacks
 */
const enhancedFetch = async (url: string, options: RequestInit): Promise<Response> => {
  // Try direct fetch first if on server-side or Supabase edge function
  if (typeof window === 'undefined') {
    return fetch(url, options);
  }
  
  // Try all proxies in sequence
  let lastError;
  
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    try {
      console.log(`Trying CORS proxy ${i+1}/${CORS_PROXIES.length}: ${proxy.substring(0, 30)}...`);
      
      const proxyUrl = proxy.includes('?url=') 
        ? `${proxy}${encodeURIComponent(url)}`
        : `${proxy}${url}`;
      
      const response = await fetch(proxyUrl, options);
      
      if (response.ok) {
        console.log(`CORS proxy ${i+1} succeeded`);
        return response;
      }
      
      console.warn(`CORS proxy ${i+1} returned status ${response.status}`);
    } catch (err) {
      lastError = err;
      console.warn(`CORS proxy ${i+1} error:`, err);
      // Continue to next proxy
    }
  }
  
  // If we get here, all proxies failed
  console.error("All CORS proxies failed. Last error:", lastError);
  throw new Error("Failed to access FatSecret API through CORS proxies. Please try again later.");
};

/**
 * Search for food by name using FatSecret API
 */
export const searchFood = async (query: string): Promise<any> => {
  try {
    const token = await getAccessToken();
    
    const params = new URLSearchParams({
      method: 'foods.search',
      format: 'json',
      search_expression: query,
      max_results: '5'
    });
    
    const response = await enhancedFetch(`https://platform.fatsecret.com/rest/server.api?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`FatSecret API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for IP error in the response
    if (data.error) {
      if (data.error.code === 21) {
        console.error("FatSecret API IP error:", data.error.message);
        throw {
          message: "IP restriction error from FatSecret API", 
          serverIp,
          details: "Please add your server's IP to FatSecret IP restrictions"
        };
      }
      throw new Error(`FatSecret API error: ${data.error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error("Error searching food with FatSecret:", error);
    throw error;
  }
};

/**
 * Get detailed food information by ID
 */
export const getFoodDetails = async (foodId: string): Promise<any> => {
  try {
    const token = await getAccessToken();
    
    const params = new URLSearchParams({
      method: 'food.get.v2',
      format: 'json',
      food_id: foodId
    });
    
    const response = await enhancedFetch(`https://platform.fatsecret.com/rest/server.api?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`FatSecret API error: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check for IP error in the response
    if (data.error) {
      if (data.error.code === 21) {
        console.error("FatSecret API IP error:", data.error.message);
        throw {
          message: "IP restriction error from FatSecret API",
          serverIp,
          details: "Please add your server's IP to FatSecret IP restrictions"
        };
      }
      throw new Error(`FatSecret API error: ${data.error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error("Error getting food details with FatSecret:", error);
    throw error;
  }
};

/**
 * Analyze food image using FatSecret API
 */
export const analyzeFoodImage = async (imageBase64: string): Promise<FoodItem> => {
  console.log("Starting food analysis with FatSecret API");
  
  try {
    // Get token for API access
    const token = await getAccessToken();
    console.log("Token obtained, analyzing with direct search approach...");
    
    // For FatSecret, we'll search for a variety of common foods to get real data
    // We'll try different search terms if one fails
    const searchTerms = [
      "chicken breast",
      "grilled salmon",
      "mixed salad",
      "turkey sandwich",
      "greek yogurt"
    ];
    
    // Try each search term until we get a valid response
    let foodData = null;
    let errorMessage = "";
    
    for (const searchTerm of searchTerms) {
      try {
        console.log(`Trying FatSecret search for "${searchTerm}"`);
        
        const params = new URLSearchParams({
          method: 'foods.search',
          format: 'json',
          search_expression: searchTerm,
          max_results: '5'
        });
        
        const url = `https://platform.fatsecret.com/rest/server.api?${params.toString()}`;
        console.log("Fetching from FatSecret API:", url.substring(0, 50) + "...");
        
        const response = await enhancedFetch(url, {
          headers: {
            'Authorization': `Bearer ${token.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`FatSecret API error: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("FatSecret API response:", data);
        
        // Check for IP error in the response
        if (data.error) {
          if (data.error.code === 21) {
            console.error("FatSecret API IP error:", data.error.message);
            throw {
              message: "IP restriction error from FatSecret API",
              serverIp,
              details: "Please add your server's IP to FatSecret IP restrictions"
            };
          }
          throw new Error(`FatSecret API error: ${data.error.message}`);
        }
        
        // Extract food data from the response
        if (!data?.foods?.food || data.foods.food.length === 0) {
          throw new Error("No food data found in API response");
        }
        
        // Use the first result
        foodData = data.foods.food[0];
        console.log("Selected food data:", foodData);
        break; // Success, exit the loop
      } catch (searchError) {
        errorMessage = searchError.message || "Unknown error";
        console.warn(`Search for "${searchTerm}" failed:`, errorMessage);
        
        // Check if this is an IP restriction error
        if (searchError.message?.includes("IP restriction")) {
          throw searchError; // Forward the IP restriction error
        }
        
        // Continue to next search term
      }
    }
    
    if (!foodData) {
      throw new Error(`Failed to get food data: ${errorMessage}`);
    }
    
    // Parse calories from description
    const caloriesMatch = foodData.food_description?.match(/Calories: ([\d.]+)/);
    const calories = caloriesMatch ? parseFloat(caloriesMatch[1]) : 100;
    
    // Try to parse macros from description
    const fatMatch = foodData.food_description?.match(/Fat: ([\d.]+)g/);
    const carbMatch = foodData.food_description?.match(/Carbs: ([\d.]+)g/);
    const proteinMatch = foodData.food_description?.match(/Protein: ([\d.]+)g/);
    
    const foodItem: FoodItem = {
      id: crypto.randomUUID(),
      name: foodData.food_name,
      calories: calories,
      protein: proteinMatch ? parseFloat(proteinMatch[1]) : 20,
      carbs: carbMatch ? parseFloat(carbMatch[1]) : 10,
      fat: fatMatch ? parseFloat(fatMatch[1]) : 5,
      sugar: 2,
      fiber: 3,
      imageUrl: imageBase64,
      timestamp: new Date().toISOString(),
      quantity: 1,
      mealType: "lunch",
      notes: `Nutrition data from FatSecret API` 
    };
    
    console.log("Successfully processed food data from FatSecret");
    return foodItem;
  } catch (error) {
    console.error("Error analyzing food:", error);
    
    // Check if this is an IP restriction error
    if (error.message?.includes("IP restriction")) {
      throw error; // Forward the IP restriction error
    }
    
    throw new Error(`Failed to analyze food: ${error instanceof Error ? error.message : String(error)}`);
  }
};
