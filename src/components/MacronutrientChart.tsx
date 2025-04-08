
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { ChartContainer, ChartLegend, ChartLegendContent } from '@/components/ui/chart';

interface MacronutrientChartProps {
  protein: number;
  carbs: number;
  fat: number;
  totalCalories: number;
}

const MacronutrientChart: React.FC<MacronutrientChartProps> = ({ 
  protein, 
  carbs, 
  fat, 
  totalCalories 
}) => {
  // Convert macros to calories
  const proteinCalories = protein * 4;
  const carbCalories = carbs * 4;
  const fatCalories = fat * 9;
  
  // Calculate total macronutrient calories
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories;
  
  // Calculate percentages for internal chart calculation (not displayed to user)
  const exactProteinPercentage = (proteinCalories / (totalMacroCalories || 1)) * 100;
  const exactCarbsPercentage = (carbCalories / (totalMacroCalories || 1)) * 100;
  const exactFatPercentage = (fatCalories / (totalMacroCalories || 1)) * 100;
  
  // Round percentages for internal use only
  let proteinPercentage = Math.round(exactProteinPercentage);
  let carbsPercentage = Math.round(exactCarbsPercentage);
  let fatPercentage = Math.round(exactFatPercentage);
  
  // Adjust for rounding errors to ensure percentages sum to 100%
  const percentageSum = proteinPercentage + carbsPercentage + fatPercentage;
  if (percentageSum !== 100 && percentageSum !== 0) {
    // Determine which value to adjust based on the decimal parts
    // The one with the largest difference between exact and rounded should be adjusted
    const proteinDiff = Math.abs(exactProteinPercentage - proteinPercentage);
    const carbsDiff = Math.abs(exactCarbsPercentage - carbsPercentage);
    const fatDiff = Math.abs(exactFatPercentage - fatPercentage);
    
    if (percentageSum > 100) {
      // Need to decrease a value
      if (proteinDiff <= carbsDiff && proteinDiff <= fatDiff) {
        proteinPercentage -= (percentageSum - 100);
      } else if (carbsDiff <= proteinDiff && carbsDiff <= fatDiff) {
        carbsPercentage -= (percentageSum - 100);
      } else {
        fatPercentage -= (percentageSum - 100);
      }
    } else {
      // Need to increase a value
      if (proteinDiff >= carbsDiff && proteinDiff >= fatDiff) {
        proteinPercentage += (100 - percentageSum);
      } else if (carbsDiff >= proteinDiff && carbsDiff >= fatDiff) {
        carbsPercentage += (100 - percentageSum);
      } else {
        fatPercentage += (100 - percentageSum);
      }
    }
  }
  
  // Prepare data for the pie chart, using calories for the chart segments
  const data = [
    { name: 'Protein', value: proteinCalories, color: '#4F46E5' },
    { name: 'Carbs', value: carbCalories, color: '#10B981' },
    { name: 'Fat', value: fatCalories, color: '#F59E0B' },
  ];

  // Check if there's no data to display
  const hasNoData = totalCalories === 0 || (protein === 0 && carbs === 0 && fat === 0);

  // For debugging the exact values
  console.log('MacronutrientChart calculation:', {
    protein, carbs, fat,
    proteinCalories, carbCalories, fatCalories,
    totalMacroCalories,
    exactProteinPercentage, exactCarbsPercentage, exactFatPercentage,
    proteinPercentage, carbsPercentage, fatPercentage,
  });

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center items-center relative">
        {hasNoData ? (
          <div className="py-10 text-center text-gray-500">
            No macronutrient data to display for the selected meal type.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
        {!hasNoData && (
          <div className="absolute text-center">
            <div className="text-3xl font-bold">{totalCalories}</div>
            <div className="text-sm text-gray-500">kcal</div>
          </div>
        )}
      </div>
      
      {!hasNoData && (
        <div className="grid grid-cols-3 gap-2 text-center mt-4">
          <div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#4F46E5]"></div>
              <span className="text-sm">Protein {Math.round(protein)}g</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#10B981]"></div>
              <span className="text-sm">Carbs {Math.round(carbs)}g</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]"></div>
              <span className="text-sm">Fat {Math.round(fat)}g</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MacronutrientChart;
