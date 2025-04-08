
import { FoodItem } from '../types';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';
import { saveBackupFoodAnalysis } from '../lib/supabase';

// Retry helper for API calls
export const retryWithBackoff = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      console.error('All retries failed:', error);
      throw error;
    }
    
    console.info(`API error. Retrying after ${delay}ms, ${retries} retries left. Error: ${error.message}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 1.5);
  }
};

// Function to analyze food using the dedicated food-analysis Supabase Edge Function
export const analyzeImage = async (imageBase64: string, userId: string, retries = 3): Promise<FoodItem> => {
  console.info(`Analyzing image with food-analysis function`);
  console.info(`Source device: ${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'}`);
  console.info(`Image size (bytes): ${imageBase64.length}`);
  
  // Desktop devices might need more retries due to larger images
  const isDesktop = !navigator.userAgent.includes('Mobile');
  if (isDesktop) {
    console.info(`Using ${retries} retries for Desktop device`);
  }
  
  // Keep track of attempts
  let attempt = 1;
  
  try {
    const result = await retryWithBackoff(async () => {
      console.info(`Attempt ${attempt} of ${retries}`);
      attempt++;
      
      // Make sure we're passing a clean base64 string without data URL prefix
      const cleanImageBase64 = imageBase64.startsWith('data:') 
        ? imageBase64.split(',')[1] 
        : imageBase64;
      
      const { data, error } = await supabase.functions.invoke('food-analysis', {
        body: {
          image: cleanImageBase64
        }
      });
      
      if (error) {
        console.error('Error from food-analysis function:', error);
        throw new Error(`Error from food-analysis function: ${error.message}`);
      }
      
      if (!data || !data.success) {
        console.error('Invalid response from food-analysis function:', data);
        throw new Error('Failed to analyze food image');
      }
      
      return data.data;
    }, retries);
    
    console.info('Food analysis result:', result);
    
    // Create the proper data URL format for the image
    const imageUrl = imageBase64.startsWith('data:') 
      ? imageBase64 
      : `data:image/jpeg;base64,${imageBase64}`;
    
    console.info('Setting image URL:', imageUrl.substring(0, 50) + '...');  // Log partial URL for debugging
    
    // Create a FoodItem from the analysis results with the proper image URL
    return {
      id: crypto.randomUUID(),
      name: result.name || 'Unknown Food',
      calories: result.calories || 0,
      protein: result.protein || 0,
      carbs: result.carbs || 0,
      fat: result.fat || 0,
      fiber: result.fiber || 0,
      sugar: result.sugar || 0,
      timestamp: new Date().toISOString(),
      userId,
      imageUrl: imageUrl,  // Make sure we use the properly formatted image URL
      mealType: 'lunch',
      quantity: 1
    };
  } catch (error) {
    console.error('Error in analyzeImage function:', error);
    
    // When all retries fail, create a fallback analysis
    const imageUrl = imageBase64.startsWith('data:')
      ? imageBase64
      : `data:image/jpeg;base64,${imageBase64}`;
    
    // Try to use the backup food analysis generator
    try {
      const backupAnalysis = await saveBackupFoodAnalysis(userId, imageUrl);
      toast.error('AI analysis failed. Using estimated values instead.');
      return backupAnalysis;
    } catch (backupError) {
      console.error('Backup analysis also failed:', backupError);
      throw new Error(`Failed to analyze food: ${error.message}`);
    }
  }
};
