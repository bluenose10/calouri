import React from 'react';
import { Progress } from '@/components/ui/progress';
import { FoodItem } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface NutritionSummaryProps {
  foodItems: FoodItem[];
}

const NutritionSummary: React.FC<NutritionSummaryProps> = ({ foodItems }) => {
  // Calculate nutrition totals
  const totals = foodItems.reduce(
    (acc, item) => {
      return {
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fat: acc.fat + item.fat,
        fiber: acc.fiber + (item.fiber || 0),
        sugar: acc.sugar + (item.sugar || 0),
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
  );

  // Convert macros to calories for accurate percentage calculations
  const proteinCalories = totals.protein * 4;
  const carbCalories = totals.carbs * 4;
  const fatCalories = totals.fat * 9;
  
  // Calculate total macro calories for percentages
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories || 1;
  
  // Prepare data for the pie chart
  const macroData = [
    { name: 'Protein', value: Math.round(proteinCalories), color: '#10b981' },
    { name: 'Carbs', value: Math.round(carbCalories), color: '#3b82f6' },
    { name: 'Fat', value: Math.round(fatCalories), color: '#f59e0b' },
  ];

  // Daily goals (example values, could be customized by user in future)
  const dailyGoals = {
    calories: 2000,
    protein: 120,
    carbs: 200,
    fat: 65,
    fiber: 30,
    sugar: 30,
  };

  // Calculate percentages for progress bars
  const percentages = {
    calories: Math.min(Math.round((totals.calories / dailyGoals.calories) * 100), 100),
    protein: Math.min(Math.round((totals.protein / dailyGoals.protein) * 100), 100),
    carbs: Math.min(Math.round((totals.carbs / dailyGoals.carbs) * 100), 100),
    fat: Math.min(Math.round((totals.fat / dailyGoals.fat) * 100), 100),
    fiber: Math.min(Math.round((totals.fiber / dailyGoals.fiber) * 100), 100),
    sugar: Math.min(Math.round((totals.sugar / dailyGoals.sugar) * 100), 100),
  };

  // Calculate macro percentages based on caloric contribution
  const macroPercentages = {
    protein: Math.round((proteinCalories / totalMacroCalories) * 100),
    carbs: Math.round((carbCalories / totalMacroCalories) * 100),
    fat: Math.round((fatCalories / totalMacroCalories) * 100),
  };

  if (foodItems.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No food entries found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Calories</span>
              <span className="text-sm text-gray-500">
                {totals.calories.toFixed(0)} / {dailyGoals.calories} kcal
              </span>
            </div>
            <Progress value={percentages.calories} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Protein</span>
              <span className="text-sm text-gray-500">
                {totals.protein.toFixed(1)} / {dailyGoals.protein} g
              </span>
            </div>
            <Progress value={percentages.protein} className="h-2 bg-green-100" indicatorClassName="bg-green-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Carbs</span>
              <span className="text-sm text-gray-500">
                {totals.carbs.toFixed(1)} / {dailyGoals.carbs} g
              </span>
            </div>
            <Progress value={percentages.carbs} className="h-2 bg-blue-100" indicatorClassName="bg-blue-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Fat</span>
              <span className="text-sm text-gray-500">
                {totals.fat.toFixed(1)} / {dailyGoals.fat} g
              </span>
            </div>
            <Progress value={percentages.fat} className="h-2 bg-yellow-100" indicatorClassName="bg-yellow-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Fiber</span>
              <span className="text-sm text-gray-500">
                {totals.fiber.toFixed(1)} / {dailyGoals.fiber} g
              </span>
            </div>
            <Progress value={percentages.fiber} className="h-2 bg-gray-100" indicatorClassName="bg-gray-500" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Sugar</span>
              <span className="text-sm text-gray-500">
                {totals.sugar.toFixed(1)} / {dailyGoals.sugar} g
              </span>
            </div>
            <Progress value={percentages.sugar} className="h-2 bg-pink-100" indicatorClassName="bg-pink-500" />
          </div>
        </div>
        
        <div>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={macroData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {macroData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`${value} calories`, undefined]} 
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500">Protein</p>
              <p className="font-medium">{macroPercentages.protein}%</p>
              <p className="text-xs">{Math.round(totals.protein)}g</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Carbs</p>
              <p className="font-medium">{macroPercentages.carbs}%</p>
              <p className="text-xs">{Math.round(totals.carbs)}g</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Fat</p>
              <p className="font-medium">{macroPercentages.fat}%</p>
              <p className="text-xs">{Math.round(totals.fat)}g</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NutritionSummary;
