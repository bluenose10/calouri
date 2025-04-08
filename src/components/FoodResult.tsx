
import React, { useState } from 'react';
import { useFoodContext } from '../context/FoodContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const FoodResult: React.FC = () => {
  const { currentFood, updateCurrentFood, addToHistory, saveAnalysis } = useFoodContext();
  const [isSaving, setIsSaving] = useState(false);

  if (!currentFood) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // First save the analysis to the food_analyses table
      await saveAnalysis(currentFood);
      
      // Use default values for the removed fields
      const foodWithDefaults = {
        ...currentFood,
        quantity: currentFood.quantity || 1,
        mealType: currentFood.mealType || 'lunch',
        notes: currentFood.notes || ''
      };
      
      // Then add to food entries and history
      await addToHistory(foodWithDefaults);
      
      toast.success('Food analysis saved successfully');
    } catch (error) {
      console.error('Error saving food analysis:', error);
      toast.error('Failed to save food analysis');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetake = () => {
    updateCurrentFood(null);
  };

  // Log image URL for debugging
  console.log('Current food image URL:', currentFood.imageUrl);

  return (
    <Card className="bg-white shadow-lg rounded-lg overflow-hidden border border-green-100">
      <div className="p-4 md:p-6 bg-gradient-to-r from-green-50 to-blue-50">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <div className="w-8 h-8 rounded-full bg-health-primary flex items-center justify-center mr-3">
            <Check className="h-5 w-5 text-white" />
          </div>
          Food Analysis Results
        </h2>
        <div className="flex flex-col space-y-1">
          <p className="text-gray-600">
            Nutritional breakdown
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row">
        {currentFood.imageUrl && (
          <div className="md:w-1/3">
            <img 
              src={currentFood.imageUrl} 
              alt={currentFood.name} 
              className="w-full h-64 md:h-full object-cover"
            />
          </div>
        )}

        <CardContent className={`p-6 ${currentFood.imageUrl ? 'md:w-2/3' : 'w-full'}`}>
          <div className="bg-green-50 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" opacity="0.2" />
                <path d="M16.25 6.75C16.25 4.13401 14.116 2 11.5 2C8.88401 2 6.75 4.13401 6.75 6.75V9H2.75L4.48612 18.6307C4.76509 20.4731 6.37862 21.8054 8.25 21.8054H14.75C16.6214 21.8054 18.2349 20.4731 18.5139 18.6307L20.25 9H16.25V6.75Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              </svg>
              <h2 className="text-lg font-medium text-green-800">{currentFood.name}</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Calories</div>
                <div className="font-bold text-xl text-gray-800">{currentFood.calories} <span className="text-sm font-normal">kcal</span></div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Protein</div>
                <div className="font-bold text-xl text-gray-800">{currentFood.protein}<span className="text-sm font-normal">g</span></div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Carbs</div>
                <div className="font-bold text-xl text-gray-800">{currentFood.carbs}<span className="text-sm font-normal">g</span></div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Fat</div>
                <div className="font-bold text-xl text-gray-800">{currentFood.fat}<span className="text-sm font-normal">g</span></div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Sugar</div>
                <div className="font-bold text-xl text-gray-800">{currentFood.sugar || 0}<span className="text-sm font-normal">g</span></div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-sm text-gray-600">Fiber</div>
                <div className="font-bold text-xl text-gray-800">{currentFood.fiber || 0}<span className="text-sm font-normal">g</span></div>
              </div>
            </div>
            
            {currentFood.notes && (
              <div className="mt-4 text-sm text-gray-600 bg-white p-3 rounded-lg">
                <span className="font-medium">Notes:</span> {currentFood.notes}
              </div>
            )}
          </div>
      
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 h-auto font-medium"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-5 w-5" /> Add to Daily Log
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleRetake}
              disabled={isSaving}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Retake Photo
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default FoodResult;
