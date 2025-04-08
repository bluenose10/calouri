
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface NutritionCardProps {
  title: string;
  value: number;
  unit: string;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'gray' | 'pink';
  goal?: number;
}

const NutritionCard: React.FC<NutritionCardProps> = ({ title, value, unit, color, goal }) => {
  const percentage = goal ? Math.min(Math.round((value / goal) * 100), 100) : null;
  
  const getColorClasses = () => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          progress: 'bg-blue-100',
          indicator: 'bg-blue-500'
        };
      case 'green':
        return {
          bg: 'bg-green-50',
          text: 'text-green-700',
          progress: 'bg-green-100',
          indicator: 'bg-green-500'
        };
      case 'purple':
        return {
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          progress: 'bg-purple-100',
          indicator: 'bg-purple-500'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          text: 'text-yellow-700',
          progress: 'bg-yellow-100',
          indicator: 'bg-yellow-500'
        };
      case 'gray':
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          progress: 'bg-gray-100',
          indicator: 'bg-gray-500'
        };
      case 'pink':
        return {
          bg: 'bg-pink-50',
          text: 'text-pink-700',
          progress: 'bg-pink-100',
          indicator: 'bg-pink-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          progress: 'bg-gray-100',
          indicator: 'bg-gray-500'
        };
    }
  };
  
  const colorClasses = getColorClasses();
  
  return (
    <Card className={`${colorClasses.bg} border-none`}>
      <CardContent className="p-4">
        <div className="flex flex-col">
          <span className={`text-sm ${colorClasses.text}`}>{title}</span>
          <div className="flex items-end mt-1">
            <span className="text-3xl font-bold">{value}</span>
            <span className="text-sm text-gray-500 ml-1 mb-1">{unit}</span>
          </div>
          
          {goal && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>{percentage}%</span>
                <span>{value} / {goal}</span>
              </div>
              <Progress 
                value={percentage} 
                className={`h-1.5 ${colorClasses.progress}`} 
                indicatorClassName={colorClasses.indicator} 
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default NutritionCard;
