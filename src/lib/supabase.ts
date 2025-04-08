
import { createClient } from '@supabase/supabase-js';
import { supabase as integratedSupabase } from '../integrations/supabase/client';
import { Database } from '../types/supabase';
import { toast } from 'sonner';
import { FoodItem } from '../types';

// Export the integrated Supabase client
export const supabase = integratedSupabase;

// Export a helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  // The integrated Supabase client is always configured
  return true;
};

// Add helper functions for food entries
export const getFoodEntries = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('food_entries')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching food entries:', error);
    toast.error('Failed to load food entries');
    return [];
  }
};

// Add helper function for food analyses
export const getFoodAnalyses = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('food_analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching food analyses:', error);
    toast.error('Failed to load food analyses');
    return [];
  }
};

// Add helper for deleting food entries
export const deleteFoodEntry = async (id: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('food_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting food entry:', error);
    toast.error('Failed to delete food entry');
    return false;
  }
};

// Add helper for deleting food analyses
export const deleteFoodAnalysis = async (id: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('food_analyses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting food analysis:', error);
    toast.error('Failed to delete food analysis');
    return false;
  }
};

// Add helper for saving backup food analysis when APIs fail
export const saveBackupFoodAnalysis = async (userId: string, imageUrl: string): Promise<FoodItem> => {
  try {
    // Create a realistic fallback food item
    const fallbackFood: FoodItem = {
      id: crypto.randomUUID(),
      name: "Mixed Meal",
      calories: 450,
      protein: 25,
      carbs: 40,
      fat: 15,
      sugar: 8,
      fiber: 6,
      imageUrl: imageUrl,
      timestamp: new Date().toISOString(),
      quantity: 1,
      mealType: "lunch",
      userId: userId,
      notes: "Estimated nutrition values - API connection issue"
    };
    
    // Save to food_analyses table if possible
    try {
      await supabase
        .from('food_analyses')
        .insert({
          id: fallbackFood.id,
          user_id: userId,
          food_name: fallbackFood.name,
          calories: fallbackFood.calories,
          protein: fallbackFood.protein,
          carbs: fallbackFood.carbs,
          fat: fallbackFood.fat,
          image_url: imageUrl,
          analysis_type: 'fallback',
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Could not save backup analysis to database:', error);
      // Continue with the local fallback even if db save fails
    }
    
    return fallbackFood;
  } catch (error) {
    console.error('Error creating backup food analysis:', error);
    throw new Error('Failed to create backup food analysis');
  }
};
