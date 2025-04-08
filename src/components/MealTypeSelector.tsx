
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MealTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string; // Add optional className prop
}

const MealTypeSelector: React.FC<MealTypeSelectorProps> = ({ value, onChange, className }) => {
  return (
    <Tabs defaultValue={value} onValueChange={onChange} className={`w-full ${className || ''}`}>
      <TabsList className="grid grid-cols-4 mb-2 w-full rounded-xl p-1 bg-gray-100">
        <TabsTrigger 
          value="breakfast" 
          className="text-xs sm:text-sm py-3 rounded-lg font-medium transition-all 
                     data-[state=active]:bg-health-primary data-[state=active]:text-white 
                     data-[state=active]:shadow-md"
        >
          Breakfast
        </TabsTrigger>
        <TabsTrigger 
          value="lunch" 
          className="text-xs sm:text-sm py-3 rounded-lg font-medium transition-all 
                     data-[state=active]:bg-health-primary data-[state=active]:text-white 
                     data-[state=active]:shadow-md"
        >
          Lunch
        </TabsTrigger>
        <TabsTrigger 
          value="dinner" 
          className="text-xs sm:text-sm py-3 rounded-lg font-medium transition-all 
                     data-[state=active]:bg-health-primary data-[state=active]:text-white 
                     data-[state=active]:shadow-md"
        >
          Dinner
        </TabsTrigger>
        <TabsTrigger 
          value="snack" 
          className="text-xs sm:text-sm py-3 rounded-lg font-medium transition-all 
                     data-[state=active]:bg-health-primary data-[state=active]:text-white 
                     data-[state=active]:shadow-md"
        >
          Snack
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};

export default MealTypeSelector;
