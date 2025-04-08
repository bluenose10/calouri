import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useFoodContext } from '../context/FoodContext';
import NutritionCard from './NutritionCard';
import FoodLog from './FoodLog';
import QuickAddFood from './QuickAddFood';
import { useAuth } from '../context/AuthContext';
import { Info, MessageSquare, ChartBar, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import FoodResult from './FoodResult';
import History from './History';
import AdminDashboard from './AdminDashboard';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

const Dashboard: React.FC = () => {
  const { history, currentFood } = useFoodContext();
  const { user } = useAuth();
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showHistoryTab, setShowHistoryTab] = useState(false);
  const { isMobile } = useIsMobile();
  
  useEffect(() => {
    document.documentElement.style.minHeight = '101vh';
    document.body.style.minHeight = '101vh';
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    
    return () => {
      document.documentElement.style.minHeight = '';
      document.body.style.minHeight = '';
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    };
  }, []);
  
  const handleMealTypeChange = (mealType: string | null) => {
    setSelectedMealType(mealType);
  };

  const filteredItems = history.filter(item => {
    const itemDate = new Date(item.timestamp || new Date());
    const today = new Date();
    const isToday = 
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear();
    
    const matchesMealType = !selectedMealType || item.mealType === selectedMealType;
    
    return isToday && matchesMealType;
  });

  const totals = filteredItems.reduce(
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

  const proteinCalories = totals.protein * 4;
  const carbCalories = totals.carbs * 4;
  const fatCalories = totals.fat * 9;
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories || 1;

  const macroPercentages = {
    protein: Math.round((proteinCalories / totalMacroCalories) * 100),
    carbs: Math.round((carbCalories / totalMacroCalories) * 100),
    fat: Math.round((fatCalories / totalMacroCalories) * 100),
  };

  let { protein: proteinPct, carbs: carbsPct, fat: fatPct } = macroPercentages;
  const pctSum = proteinPct + carbsPct + fatPct;
  
  if (pctSum !== 100 && pctSum !== 0) {
    const proteinExact = (proteinCalories / totalMacroCalories) * 100;
    const carbsExact = (carbCalories / totalMacroCalories) * 100;
    const fatExact = (fatCalories / totalMacroCalories) * 100;
    
    const proteinDiff = Math.abs(proteinExact - proteinPct);
    const carbsDiff = Math.abs(carbsExact - carbsPct);
    const fatDiff = Math.abs(fatExact - fatPct);
    
    if (pctSum > 100) {
      if (proteinDiff >= carbsDiff && proteinDiff >= fatDiff) {
        proteinPct -= (pctSum - 100);
      } else if (carbsDiff >= proteinDiff && carbsDiff >= fatDiff) {
        carbsPct -= (pctSum - 100);
      } else {
        fatPct -= (pctSum - 100);
      }
    } else {
      if (proteinDiff >= carbsDiff && proteinDiff >= fatDiff) {
        proteinPct += (100 - pctSum);
      } else if (carbsDiff >= proteinDiff && carbsDiff >= fatDiff) {
        carbsPct += (100 - pctSum);
      } else {
        fatPct += (100 - pctSum);
      }
    }
    
    macroPercentages.protein = proteinPct;
    macroPercentages.carbs = carbsPct;
    macroPercentages.fat = fatPct;
  }

  const dailyGoals = {
    calories: 2000,
    protein: 120,
    carbs: 200,
    fat: 65,
    fiber: 30,
    sugar: 30,
  };

  const todayItems = history.filter(item => {
    const itemDate = new Date(item.timestamp || new Date());
    const today = new Date();
    return (
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear()
    );
  });

  if (!user) {
    return null;
  }

  return (
    <div className="w-full max-w-7xl mx-auto pb-8">
      <div className="mb-8">
        {/* Empty div to maintain spacing */}
      </div>

      {/* Add Premium Features section */}
      <div className="mb-6">
        <div className="bg-health-light border border-green-100 rounded-lg overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-health-primary/10 to-green-100/30">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Premium Features</h2>
            <p className="text-gray-700 text-sm">Access advanced tools to improve your nutrition journey</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
            <Link to="/nutrichat" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="bg-health-primary/10 p-3 rounded-full mb-3">
                    <MessageSquare className="h-6 w-6 text-health-primary" />
                  </div>
                  <h3 className="font-bold mb-1">NutriChat</h3>
                  <p className="text-sm text-gray-600 mb-3">AI-powered nutrition assistant</p>
                  <Button variant="outline" size="sm" className="mt-auto">Try Now</Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/foodinsights" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="bg-health-primary/10 p-3 rounded-full mb-3">
                    <ChartBar className="h-6 w-6 text-health-primary" />
                  </div>
                  <h3 className="font-bold mb-1">FoodInsights</h3>
                  <p className="text-sm text-gray-600 mb-3">Visualize your nutrition data</p>
                  <Button variant="outline" size="sm" className="mt-auto">Explore</Button>
                </CardContent>
              </Card>
            </Link>
            
            <Link to="/healthtracker" className="block">
              <Card className="h-full hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="bg-health-primary/10 p-3 rounded-full mb-3">
                    <TrendingUp className="h-6 w-6 text-health-primary" />
                  </div>
                  <h3 className="font-bold mb-1">HealthTracker</h3>
                  <p className="text-sm text-gray-600 mb-3">Set goals and track progress</p>
                  <Button variant="outline" size="sm" className="mt-auto">Get Started</Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </div>

      {/* Add AdminDashboard at the top */}
      <div className="mb-6">
        <AdminDashboard />
      </div>

      <Alert className="mb-6 bg-health-light border-green-100">
        <Info className="h-5 w-5 text-health-primary" />
        <AlertDescription className="text-gray-700">
          <div className="space-y-2">
            <p className="font-medium text-lg">About Your Nutrition Goals</p>
            <p className="text-sm md:text-base mb-2">
              The dashboard displays standard daily nutritional goals based on a 2000 calorie diet:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-sm md:text-base">
              <li><span className="font-medium">Calories: 2000 kcal</span> - Based on average adult needs</li>
              <li><span className="font-medium">Protein: 120g</span> - Approximately 24% of daily calories (1g protein = 4 calories)</li>
              <li><span className="font-medium">Carbs: 200g</span> - Approximately 40% of daily calories (1g carbs = 4 calories)</li>
              <li><span className="font-medium">Fat: 65g</span> - Approximately 36% of daily calories (1g fat = 9 calories)</li>
              <li><span className="font-medium">Fiber: 30g</span> - Based on general dietary recommendations</li>
              <li><span className="font-medium">Sugar: 30g</span> - Recommended maximum for added sugars</li>
            </ul>
            <p className="text-xs md:text-sm text-slate-500 italic mt-3 pt-2 border-t border-green-100">
              Note: These are general guidelines. Individual nutritional needs vary based on factors like age, gender, weight, height, activity level, and health goals.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Only show QuickAddFood on mobile */}
      {isMobile && (
        <div className="mb-6">
          <QuickAddFood />
        </div>
      )}

      {currentFood && !isAnalyzing && (
        <div className="mb-8">
          <FoodResult />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">
              {selectedMealType ? `${selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} Nutrition` : "Today's Nutrition Summary"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <NutritionCard 
                title="Calories" 
                value={Math.round(totals.calories)} 
                unit="kcal today"
                color="blue"
                goal={dailyGoals.calories} 
              />
              <NutritionCard 
                title="Protein" 
                value={Math.round(totals.protein)} 
                unit="g"
                color="green"
                goal={dailyGoals.protein}
              />
              <NutritionCard 
                title="Carbs" 
                value={Math.round(totals.carbs)} 
                unit="g"
                color="purple"
                goal={dailyGoals.carbs}
              />
              <NutritionCard 
                title="Fat" 
                value={Math.round(totals.fat)} 
                unit="g"
                color="yellow"
                goal={dailyGoals.fat}
              />
              <NutritionCard 
                title="Fiber" 
                value={Math.round(totals.fiber)} 
                unit="g"
                color="gray"
                goal={dailyGoals.fiber}
              />
              <NutritionCard 
                title="Sugar" 
                value={Math.round(totals.sugar)} 
                unit="g"
                color="pink"
                goal={dailyGoals.sugar}
              />
            </div>
          </div>

          <div className="mb-8">
            <FoodLog 
              foodItems={todayItems} 
              onMealTypeChange={handleMealTypeChange}
            />
          </div>
          
          <div>
            <History />
          </div>
        </div>

        {/* Right column - show QuickAddFood in right column on desktop */}
        <div className="lg:col-span-1">
          <div className="hidden lg:block">
            <QuickAddFood />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
