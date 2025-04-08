import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { FoodItem, FoodContextType } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { usePremiumAccess } from '../hooks/use-premium-access';

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export const useFoodContext = () => {
  const context = useContext(FoodContext);
  if (!context) {
    throw new Error('useFoodContext must be used within a FoodProvider');
  }
  return context;
};

interface FoodProviderProps {
  children: ReactNode;
}

export const FoodProvider: React.FC<FoodProviderProps> = ({ children }) => {
  const [currentFood, setCurrentFood] = useState<FoodItem | null>(null);
  const [history, setHistory] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { isPremium } = usePremiumAccess();
  
  const FREE_RETENTION_DAYS = 7;
  const PREMIUM_RETENTION_DAYS = 30;
  
  const getRetentionDays = () => {
    return isPremium ? PREMIUM_RETENTION_DAYS : FREE_RETENTION_DAYS;
  };
  
  const [analyticsData, setAnalyticsData] = useState<{
    monthlyAverages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    weeklyTrends: any[];
  }>({
    monthlyAverages: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    weeklyTrends: []
  });

  const cleanupOldEntries = async () => {
    if (!user) return;
    
    const retentionDays = getRetentionDays();
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - retentionDays);
    
    try {
      const { data: tableExists, error: checkError } = await supabase
        .from('food_entries')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (checkError && checkError.code === '42P01') {
        console.log('Food entries table does not exist yet');
        return;
      }
      
      const { error } = await supabase
        .from('food_entries')
        .delete()
        .eq('user_id', user.id)
        .lt('timestamp', cutoffDate.toISOString());
      
      if (error) throw error;
      
      const { error: analysesError } = await supabase
        .from('food_analyses')
        .delete()
        .eq('user_id', user.id)
        .lt('created_at', cutoffDate.toISOString());
        
      if (analysesError) console.error('Error cleaning up old food analyses:', analysesError);
      
      setHistory(prevHistory => 
        prevHistory.filter(item => {
          const itemDate = new Date(item.timestamp);
          return differenceInDays(today, itemDate) < retentionDays;
        })
      );
    } catch (error) {
      console.error('Error cleaning up old food entries:', error);
    }
  };

  const loadUserHistory = async () => {
    if (!user) {
      return;
    }

    setIsLoading(true);
    try {
      const retentionDays = getRetentionDays();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const { data: entriesData, error: entriesError } = await supabase
        .from('food_entries')
        .select('*')
        .eq('user_id', user.id)
        .gte('timestamp', cutoffDate.toISOString())
        .order('timestamp', { ascending: false });

      if (entriesError && entriesError.code !== '42P01') {
        throw entriesError;
      }

      const { data: analysesData, error: analysesError } = await supabase
        .from('food_analyses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });
        
      if (analysesError) {
        console.error('Error loading food analyses:', analysesError);
      }

      const foodItems: FoodItem[] = [];
      
      if (entriesData) {
        const entryItems = entriesData.map(item => ({
          id: item.id,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          timestamp: item.timestamp,
          userId: item.user_id,
          mealType: item.meal_type || 'lunch',
          notes: item.notes || '',
          quantity: item.quantity || 1,
          fiber: item.fiber || 0,
          sugar: item.sugar || 0,
          imageUrl: null
        }));
        
        foodItems.push(...entryItems);
      }
      
      if (analysesData) {
        const analysisItems = analysesData.map(item => ({
          id: item.id,
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          carbs: item.carbs,
          fat: item.fat,
          timestamp: item.created_at,
          userId: item.user_id,
          mealType: item.meal_type || 'lunch',
          notes: item.notes || '',
          quantity: 1,
          fiber: item.fiber || 0,
          sugar: item.sugar || 0,
          imageUrl: item.image_url
        }));
        
        foodItems.push(...analysisItems);
      }
      
      foodItems.sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });

      setHistory(foodItems);
      
      calculateAnalytics(foodItems);
      
    } catch (error) {
      console.error('Error loading food history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAnalytics = (foodItems: FoodItem[]) => {
    if (foodItems.length === 0) return;
    
    const totalItems = foodItems.length;
    const totals = foodItems.reduce(
      (acc, item) => {
        return {
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    const monthlyAverages = {
      calories: Math.round(totals.calories / totalItems),
      protein: Math.round(totals.protein / totalItems),
      carbs: Math.round(totals.carbs / totalItems),
      fat: Math.round(totals.fat / totalItems)
    };
    
    const now = new Date();
    const weeklyTrends = [];
    
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (7 * i + 7));
      
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - (7 * i));
      
      const weekItems = foodItems.filter(item => {
        const itemDate = new Date(item.timestamp || Date.now());
        return itemDate >= weekStart && itemDate < weekEnd;
      });
      
      if (weekItems.length > 0) {
        const weekTotals = weekItems.reduce(
          (acc, item) => {
            return {
              calories: acc.calories + item.calories,
              protein: acc.protein + item.protein,
              carbs: acc.carbs + item.carbs,
              fat: acc.fat + item.fat
            };
          },
          { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );
        
        const weekAvg = {
          week: `Week ${i + 1}`,
          calories: Math.round(weekTotals.calories / weekItems.length),
          protein: Math.round(weekTotals.protein / weekItems.length),
          carbs: Math.round(weekTotals.carbs / weekItems.length),
          fat: Math.round(weekTotals.fat / weekItems.length)
        };
        
        weeklyTrends.push(weekAvg);
      }
    }
    
    setAnalyticsData({
      monthlyAverages,
      weeklyTrends
    });
  };

  useEffect(() => {
    if (user) {
      loadUserHistory();
      cleanupOldEntries();
    }
  }, [user, isPremium]);

  useEffect(() => {
    if (!user) return;
    
    const dailyCleanup = setInterval(() => {
      cleanupOldEntries();
    }, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(dailyCleanup);
  }, [user, isPremium]);

  const addToHistory = async (food: FoodItem) => {
    const foodWithoutImage = {
      ...food,
      imageUrl: null
    };

    if (user) {
      try {
        const timestamp = typeof food.timestamp === 'string' 
          ? food.timestamp 
          : food.timestamp instanceof Date 
            ? food.timestamp.toISOString() 
            : new Date().toISOString();
            
        const { error } = await supabase
          .from('food_entries')
          .insert({
            id: food.id,
            user_id: user.id,
            name: food.name,
            calories: food.calories,
            protein: food.protein,
            carbs: food.carbs,
            fat: food.fat,
            timestamp: timestamp,
            meal_type: food.mealType || 'lunch',
            notes: food.notes || '',
            quantity: food.quantity || 1,
            fiber: food.fiber || 0,
            sugar: food.sugar || 0
          });

        if (error) throw error;
      } catch (error) {
        console.error('Error saving food entry:', error);
      }
    }

    setHistory((prev) => [foodWithoutImage, ...prev]);
    setCurrentFood(null);
  };

  const saveAnalysis = async (food: FoodItem) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('food_analyses')
        .insert({
          user_id: user.id,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          fiber: food.fiber || 0,
          sugar: food.sugar || 0,
          image_url: food.imageUrl,
          meal_type: food.mealType || 'lunch',
          notes: food.notes || ''
        });
        
      if (error) throw error;
      
      loadUserHistory();
    } catch (error) {
      console.error('Error saving food analysis:', error);
      throw error;
    }
  };

  const deleteFromHistory = async (id: string) => {
    try {
      setHistory(prev => prev.filter(item => item.id !== id));
      
      if (user) {
        let { error } = await supabase
          .from('food_entries')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error && error.code !== '42P01') {
          console.error('Error deleting from food_entries:', error);
        }
        
        let { error: analysisError } = await supabase
          .from('food_analyses')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);
          
        if (analysisError && analysisError.code !== '42P01') {
          console.error('Error deleting from food_analyses:', analysisError);
        }
      }
    } catch (error) {
      console.error('Error deleting food entry:', error);
      loadUserHistory();
      throw error;
    }
  };

  const updateCurrentFood = (updates: Partial<FoodItem>) => {
    if (currentFood) {
      setCurrentFood({
        ...currentFood,
        ...updates
      });
    }
  };

  const value = {
    currentFood,
    setCurrentFood,
    updateCurrentFood,
    history,
    addToHistory,
    saveAnalysis,
    deleteFromHistory,
    loadUserHistory,
    isLoading,
    retentionDays: getRetentionDays(),
    analyticsData
  };

  return (
    <FoodContext.Provider value={value}>
      {children}
    </FoodContext.Provider>
  );
};
