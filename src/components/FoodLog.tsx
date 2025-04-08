
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FoodItem } from '../types';
import { Clock, Trash2 } from 'lucide-react';
import { useFoodContext } from '../context/FoodContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface FoodLogProps {
  foodItems: FoodItem[];
  onMealTypeChange?: (mealType: string | null) => void;
}

const FoodLog: React.FC<FoodLogProps> = ({ foodItems, onMealTypeChange }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack'>('all');
  const { deleteFromHistory } = useFoodContext();
  
  // Sort food items by timestamp (newest first)
  const sortedItems = [...foodItems].sort((a, b) => {
    const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return dateB - dateA;
  });
  
  // Filter items based on meal type
  const getFilteredItems = (mealType: string | null) => {
    if (!mealType || mealType === 'all') {
      return sortedItems;
    }
    return sortedItems.filter(item => item.mealType?.toLowerCase() === mealType.toLowerCase());
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab);
    // Notify parent component about meal type change
    if (onMealTypeChange) {
      onMealTypeChange(value === 'all' ? null : value);
    }
  };

  // Handle food item deletion
  const handleDeleteItem = async (id: string) => {
    try {
      await deleteFromHistory(id);
      toast.success("Food entry deleted successfully");
    } catch (error) {
      console.error("Error deleting food entry:", error);
      toast.error("Failed to delete food entry");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Food Log</CardTitle>
        <button className="text-sm font-medium text-primary">+ Add Food</button>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="all" 
          value={activeTab} 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid grid-cols-5 mb-4 w-full">
            <TabsTrigger value="all">
              All
            </TabsTrigger>
            <TabsTrigger value="breakfast">
              Breakfast
            </TabsTrigger>
            <TabsTrigger value="lunch">
              Lunch
            </TabsTrigger>
            <TabsTrigger value="dinner">
              Dinner
            </TabsTrigger>
            <TabsTrigger value="snack">
              Snack
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {renderFoodItems(getFilteredItems('all'))}
          </TabsContent>
          
          <TabsContent value="breakfast" className="space-y-4">
            {renderFoodItems(getFilteredItems('breakfast'))}
          </TabsContent>
          
          <TabsContent value="lunch" className="space-y-4">
            {renderFoodItems(getFilteredItems('lunch'))}
          </TabsContent>
          
          <TabsContent value="dinner" className="space-y-4">
            {renderFoodItems(getFilteredItems('dinner'))}
          </TabsContent>
          
          <TabsContent value="snack" className="space-y-4">
            {renderFoodItems(getFilteredItems('snack'))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
  
  function renderFoodItems(items: FoodItem[]) {
    if (items.length === 0) {
      return (
        <div className="text-center py-6 text-gray-500">
          No food entries for {activeTab === 'all' ? 'today' : activeTab}.
        </div>
      );
    }
    
    return items.map((item) => {
      const itemKey = item.id || `${item.name}-${new Date().getTime()}`;
      
      return (
        <div key={itemKey} className="flex items-center justify-between py-2 border-b border-gray-100 group">
          <div className="flex items-center gap-3">
            {item.imageUrl && (
              <div className="w-12 h-12 rounded overflow-hidden">
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <div className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700 mb-1">
                {item.mealType || 'Meal'}
              </div>
              <h4 className="font-medium">{item.name}</h4>
              <div className="text-xs text-gray-500 flex items-center mt-1">
                <Clock className="w-3 h-3 mr-1" /> 
                {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No time'}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <div className="text-right mr-4">
              <div className="font-medium">{item.calories} kcal</div>
              <div className="text-xs text-gray-500">
                Protein {Math.round(item.protein)}g • Carbs {Math.round(item.carbs)}g • Fat {Math.round(item.fat)}g
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="opacity-0 group-hover:opacity-100 transition-opacity" 
              onClick={() => item.id && handleDeleteItem(item.id)}
              title="Delete entry"
            >
              <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
            </Button>
          </div>
        </div>
      );
    });
  }
};

export default FoodLog;
