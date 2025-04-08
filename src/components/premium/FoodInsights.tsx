
import React, { useState } from 'react';
import { ChartBar, Lock, TrendingUp, Calendar, Utensils, Clock, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFoodContext } from '../../context/FoodContext';
import { useAuth } from '../../context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';
import { FoodItem } from '@/types';

const FoodInsights: React.FC = () => {
  const { user } = useAuth();
  const { history, analyticsData } = useFoodContext();
  const { isMobile } = useIsMobile();
  const [activeTab, setActiveTab] = useState('nutrition');
  const [viewMode, setViewMode] = useState<'today' | 'average'>('today');
  
  // Default to true for now - in a real application this would be determined by the user's subscription status
  const isPremium = true;
  
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  
  // Get today's food items
  const todayItems = history.filter(item => {
    const itemDate = new Date(item.timestamp || new Date());
    const today = new Date();
    return (
      itemDate.getDate() === today.getDate() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear()
    );
  });
  
  // Calculate nutrition totals for today
  const todayTotals = todayItems.reduce(
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
  
  // Generate macronutrient data for the pie chart
  const getMacroData = () => {
    if (viewMode === 'today') {
      return [
        { name: 'Protein', value: Math.round(todayTotals.protein) || 0 },
        { name: 'Carbs', value: Math.round(todayTotals.carbs) || 0 },
        { name: 'Fat', value: Math.round(todayTotals.fat) || 0 },
      ];
    } else {
      return [
        { name: 'Protein', value: analyticsData.monthlyAverages.protein || 0 },
        { name: 'Carbs', value: analyticsData.monthlyAverages.carbs || 0 },
        { name: 'Fat', value: analyticsData.monthlyAverages.fat || 0 },
      ];
    }
  };
  
  const macroData = getMacroData();
  
  // Generate nutrition overview data
  const getNutritionData = () => {
    if (viewMode === 'today') {
      return [
        {
          name: "Today's Totals",
          calories: Math.round(todayTotals.calories),
          protein: Math.round(todayTotals.protein),
          carbs: Math.round(todayTotals.carbs),
          fat: Math.round(todayTotals.fat),
          fiber: Math.round(todayTotals.fiber),
          sugar: Math.round(todayTotals.sugar),
        }
      ];
    } else {
      return [
        {
          name: 'Daily Average',
          calories: analyticsData.monthlyAverages.calories,
          protein: analyticsData.monthlyAverages.protein,
          carbs: analyticsData.monthlyAverages.carbs,
          fat: analyticsData.monthlyAverages.fat,
        }
      ];
    }
  };
  
  // Generate meal type distribution data
  const generateMealTypeData = () => {
    const itemsToUse = viewMode === 'today' ? todayItems : history;
    const mealCounts: Record<string, number> = {};
    
    itemsToUse.forEach(item => {
      const mealType = item.mealType || 'other';
      mealCounts[mealType] = (mealCounts[mealType] || 0) + 1;
    });
    
    return Object.entries(mealCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value
    }));
  };
  
  const mealTypeData = generateMealTypeData();
  
  // Generate trend data for the line chart
  const trendData = analyticsData.weeklyTrends.length > 0 
    ? analyticsData.weeklyTrends 
    : [
        { week: 'Week 1', calories: 0 },
        { week: 'Week 2', calories: 0 },
        { week: 'Week 3', calories: 0 },
        { week: 'Week 4', calories: 0 }
      ];

  // If no data is available, show placeholders
  const hasData = history.length > 0;
  const hasDataToday = todayItems.length > 0;

  // Tab explanation texts
  const tabExplanations = {
    nutrition: "View your total nutrient intake including calories, protein, carbs, fat, fiber, and sugar. Compare today's consumption with your historical average.",
    macros: "Analyze the balance of macronutrients (protein, carbs, fat) in your diet and see how your meals are distributed throughout the day.",
    trends: "Track your nutritional patterns over time. See how your calorie and protein intake changes week by week to identify long-term habits."
  };

  return (
    <div className="px-1 sm:px-4 py-4 sm:py-8">
      <div className="text-center mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-3xl font-bold text-health-primary mb-1 sm:mb-2">FoodInsights</h1>
        <p className="text-gray-600 max-w-3xl mx-auto text-xs sm:text-sm">
          Get detailed insights into your nutrition habits. Our analytics tools help you track patterns, understand your diet composition, and make informed decisions about your health.
        </p>
      </div>
      
      <div className="bg-[#f5f7f9] p-2 sm:p-3 rounded-md mb-4 sm:mb-6 text-xs flex items-start gap-2">
        <Info className="h-4 w-4 sm:h-5 sm:w-5 text-health-primary mt-0.5 flex-shrink-0" />
        <p className="text-gray-700">
          <span className="font-medium">Two data views available:</span> "Today" shows nutrition totals from today's logs, 
          while "Average" displays historical averages across your entire food history.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4 sm:mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="nutrition" className="text-xs sm:text-sm px-1 py-1.5 sm:py-2.5">Nutrition</TabsTrigger>
          <TabsTrigger value="macros" className="text-xs sm:text-sm px-1 py-1.5 sm:py-2.5">Macros</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs sm:text-sm px-1 py-1.5 sm:py-2.5">Trends</TabsTrigger>
        </TabsList>
        
        {/* Show current tab explanation */}
        <div className="mt-3 mb-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 sm:p-3 rounded-md">
          <p>{tabExplanations[activeTab as keyof typeof tabExplanations]}</p>
        </div>
        
        <TabsContent value="nutrition" className="mt-2 sm:mt-4">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Nutrition Overview</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {viewMode === 'today' 
                      ? "Today's nutrition totals based on your food log" 
                      : "Average daily nutrition values across your entire food history"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button 
                    size="sm" 
                    variant={viewMode === 'today' ? 'default' : 'outline'}
                    onClick={() => setViewMode('today')}
                    className={`text-xs h-7 px-2 sm:h-9 sm:px-3 ${viewMode === 'today' ? 'bg-health-primary hover:bg-health-primary/90' : ''}`}
                  >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Today
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'average' ? 'default' : 'outline'}
                    onClick={() => setViewMode('average')}
                    className={`text-xs h-7 px-2 sm:h-9 sm:px-3 ${viewMode === 'average' ? 'bg-health-primary hover:bg-health-primary/90' : ''}`}
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Average
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {isPremium ? (
                (viewMode === 'today' && !hasDataToday) ? (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-muted-foreground text-xs sm:text-sm">No food entries for today. Add meals to see nutrition data.</p>
                  </div>
                ) : (hasData ? (
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getNutritionData()}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip contentStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                        <Bar dataKey="calories" fill="#8884d8" name="Calories (kcal)" />
                        <Bar dataKey="protein" fill="#82ca9d" name="Protein (g)" />
                        <Bar dataKey="carbs" fill="#ffc658" name="Carbs (g)" />
                        <Bar dataKey="fat" fill="#ff8042" name="Fat (g)" />
                        {viewMode === 'today' && (
                          <>
                            <Bar dataKey="fiber" fill="#a9a9a9" name="Fiber (g)" />
                            <Bar dataKey="sugar" fill="#ff69b4" name="Sugar (g)" />
                          </>
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-muted-foreground text-xs sm:text-sm">Log meals to see your nutrition overview</p>
                  </div>
                ))
              ) : (
                <div className="relative h-48 sm:h-64 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-health-primary mb-2" />
                    <p className="text-xs sm:text-sm text-gray-200 max-w-[200px] text-center">
                      Upgrade to premium to access detailed nutrition analytics
                    </p>
                  </div>
                  <div className="blur-sm">Nutrition chart preview</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="macros" className="mt-2 sm:mt-4">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Macro Distribution</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {viewMode === 'today' 
                      ? "Today's macronutrient distribution" 
                      : "Average macronutrient distribution across your entire food history"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button 
                    size="sm" 
                    variant={viewMode === 'today' ? 'default' : 'outline'}
                    onClick={() => setViewMode('today')}
                    className={`text-xs h-7 px-2 sm:h-9 sm:px-3 ${viewMode === 'today' ? 'bg-health-primary hover:bg-health-primary/90' : ''}`}
                  >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Today
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'average' ? 'default' : 'outline'}
                    onClick={() => setViewMode('average')}
                    className={`text-xs h-7 px-2 sm:h-9 sm:px-3 ${viewMode === 'average' ? 'bg-health-primary hover:bg-health-primary/90' : ''}`}
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Average
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {isPremium ? (
                (viewMode === 'today' && !hasDataToday) ? (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-muted-foreground text-xs sm:text-sm">No food entries for today. Add meals to see macro distribution.</p>
                  </div>
                ) : (hasData && macroData.some(item => item.value > 0) ? (
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={isMobile ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}g`} contentStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-muted-foreground text-xs sm:text-sm">Log meals to see your macro distribution</p>
                  </div>
                ))
              ) : (
                <div className="relative h-48 sm:h-64 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-health-primary mb-2" />
                    <p className="text-xs sm:text-sm text-gray-200 max-w-[200px] text-center">
                      Upgrade to premium to access macro distribution data
                    </p>
                  </div>
                  <div className="blur-sm">Macro chart preview</div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="mt-4 sm:mt-6">
            <CardHeader className="p-3 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Meal Type Distribution</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {viewMode === 'today' 
                      ? "Today's meal type distribution" 
                      : "Meal type distribution across your entire food history"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button 
                    size="sm" 
                    variant={viewMode === 'today' ? 'default' : 'outline'}
                    onClick={() => setViewMode('today')}
                    className={`text-xs h-7 px-2 sm:h-9 sm:px-3 ${viewMode === 'today' ? 'bg-health-primary hover:bg-health-primary/90' : ''}`}
                  >
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Today
                  </Button>
                  <Button 
                    size="sm" 
                    variant={viewMode === 'average' ? 'default' : 'outline'}
                    onClick={() => setViewMode('average')}
                    className={`text-xs h-7 px-2 sm:h-9 sm:px-3 ${viewMode === 'average' ? 'bg-health-primary hover:bg-health-primary/90' : ''}`}
                  >
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Average
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {isPremium ? (
                (viewMode === 'today' && !hasDataToday) ? (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-muted-foreground text-xs sm:text-sm">No food entries for today. Add meals to see meal type distribution.</p>
                  </div>
                ) : (hasData && mealTypeData.length > 0 ? (
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mealTypeData}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={isMobile ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {mealTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-muted-foreground text-xs sm:text-sm">Log different meal types to see distribution</p>
                  </div>
                ))
              ) : (
                <div className="relative h-48 sm:h-64 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-health-primary mb-2" />
                    <p className="text-xs sm:text-sm text-gray-200 max-w-[200px] text-center">
                      Upgrade to premium to analyze meal type distribution
                    </p>
                  </div>
                  <div className="blur-sm">Meal type distribution preview</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="mt-2 sm:mt-4">
          <Card>
            <CardHeader className="p-3 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Weekly Trends</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Discover your eating habits and calorie trends over time</CardDescription>
            </CardHeader>
            <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
              {isPremium ? (
                hasData && analyticsData.weeklyTrends.length > 0 ? (
                  <div className="h-48 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={trendData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
                        <Tooltip contentStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                        <Legend wrapperStyle={{ fontSize: isMobile ? '10px' : '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="calories" 
                          stroke="#8884d8" 
                          name="Avg. Calories"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="protein" 
                          stroke="#82ca9d" 
                          name="Avg. Protein (g)" 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 sm:h-64 flex items-center justify-center bg-gray-50 rounded-md">
                    <p className="text-muted-foreground text-xs sm:text-sm">Log meals over time to see your trends</p>
                  </div>
                )
              ) : (
                <div className="relative h-48 sm:h-64 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Lock className="h-6 w-6 sm:h-8 sm:w-8 text-health-primary mb-2" />
                    <p className="text-xs sm:text-sm text-gray-200 max-w-[200px] text-center">
                      Upgrade to premium to analyze your weekly patterns
                    </p>
                  </div>
                  <div className="blur-sm">Weekly pattern preview</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {!isPremium && (
        <div className="mt-4 sm:mt-8 bg-health-light border border-green-100 rounded-lg p-4 sm:p-6 text-center">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">Unlock Advanced Analytics</h2>
          <p className="text-gray-600 mb-3 sm:mb-4 text-xs sm:text-sm">
            Get detailed insights into your nutrition habits with premium FoodInsights
          </p>
          <Button className="bg-health-primary hover:bg-health-primary/90 text-xs sm:text-sm">
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
};

export default FoodInsights;
