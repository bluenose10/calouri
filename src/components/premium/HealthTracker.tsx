import React, { useState, useEffect } from 'react';
import { Target, Calendar, Lock, BadgeCheck, Clock, Calendar as CalendarIcon, PlusCircle, MinusCircle, BarChart4, CheckCircle2, Save, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import NutritionCard from '../NutritionCard';
import { useToast } from '@/hooks/use-toast';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useFoodContext } from '@/context/FoodContext';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialGoals = {
  calories: { current: 0, target: 2000 },
  protein: { current: 0, target: 75 },
  carbs: { current: 0, target: 250 },
  fat: { current: 0, target: 65 }
};

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description: string;
  type: 'goal' | 'milestone' | 'checkpoint';
  completed: boolean;
}

const initialEvents: TimelineEvent[] = [];

const HealthTracker: React.FC = () => {
  const isPremium = true; // Change to 'false' to see locked features
  const { toast } = useToast();
  const { user } = useAuth();
  const { history, analyticsData } = useFoodContext();
  const [goals, setGoals] = useState(initialGoals);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>(initialEvents);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventType, setNewEventType] = useState<'goal' | 'milestone' | 'checkpoint'>('goal');
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  
  const form = useForm({
    defaultValues: {
      caloriesTarget: initialGoals.calories.target,
      proteinTarget: initialGoals.protein.target,
      carbsTarget: initialGoals.carbs.target,
      fatTarget: initialGoals.fat.target
    }
  });

  useEffect(() => {
    if (history.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const todaysEntries = history.filter(item => {
        const itemDate = new Date(item.timestamp || Date.now()).toISOString().split('T')[0];
        return itemDate === today;
      });
      
      if (todaysEntries.length > 0) {
        const totals = todaysEntries.reduce(
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
        
        setGoals(prev => ({
          calories: { ...prev.calories, current: Math.round(totals.calories) },
          protein: { ...prev.protein, current: Math.round(totals.protein) },
          carbs: { ...prev.carbs, current: Math.round(totals.carbs) },
          fat: { ...prev.fat, current: Math.round(totals.fat) }
        }));
      }
    }
  }, [history]);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const { data: goalsData, error: goalsError } = await supabase
          .from('user_nutrition_goals')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (goalsError && goalsError.code !== 'PGRST116') {
          console.error('Error loading goals:', goalsError);
        }
        
        if (goalsData) {
          setGoals(prev => ({
            calories: { current: prev.calories.current, target: goalsData.calories_target },
            protein: { current: prev.protein.current, target: goalsData.protein_target },
            carbs: { current: prev.carbs.current, target: goalsData.carbs_target },
            fat: { current: prev.fat.current, target: goalsData.fat_target }
          }));
          
          form.reset({
            caloriesTarget: goalsData.calories_target,
            proteinTarget: goalsData.protein_target,
            carbsTarget: goalsData.carbs_target,
            fatTarget: goalsData.fat_target
          });
        }
        
        const { data: eventsData, error: eventsError } = await supabase
          .from('nutrition_timeline_events')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });
          
        if (eventsError) {
          console.error('Error loading timeline events:', eventsError);
        }
        
        if (eventsData && eventsData.length > 0) {
          const formattedEvents = eventsData.map(event => ({
            id: event.id,
            title: event.title,
            date: event.date,
            description: event.description,
            type: event.type as 'goal' | 'milestone' | 'checkpoint',
            completed: event.completed
          }));
          
          setTimelineEvents(formattedEvents);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, [user]);

  const saveGoals = async (formData: any) => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to save your goals",
        variant: "destructive"
      });
      return;
    }
    
    const newGoals = {
      calories: { current: goals.calories.current, target: formData.caloriesTarget },
      protein: { current: goals.protein.current, target: formData.proteinTarget },
      carbs: { current: goals.carbs.current, target: formData.carbsTarget },
      fat: { current: goals.fat.current, target: formData.fatTarget }
    };
    
    try {
      const { error } = await supabase
        .from('user_nutrition_goals')
        .upsert({
          user_id: user.id,
          calories_target: formData.caloriesTarget,
          protein_target: formData.proteinTarget,
          carbs_target: formData.carbsTarget,
          fat_target: formData.fatTarget,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
        
      if (error) throw error;
      
      setGoals(newGoals);
      setIsEditingGoals(false);
      
      toast({
        title: "Goals Saved",
        description: "Your nutrition goals have been updated",
      });
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: "Error Saving Goals",
        description: "There was a problem saving your goals",
        variant: "destructive"
      });
    }
  };

  const addTimelineEvent = async () => {
    if (!user) {
      toast({
        title: "Not logged in",
        description: "Please log in to add timeline events",
        variant: "destructive"
      });
      return;
    }
    
    if (!newEventTitle || !newEventDate) {
      toast({
        title: "Missing information",
        description: "Please fill out all fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const newEvent: TimelineEvent = {
        id: Date.now().toString(),
        title: newEventTitle,
        date: newEventDate,
        description: `${newEventType.charAt(0).toUpperCase() + newEventType.slice(1)} for nutritional progress`,
        type: newEventType,
        completed: false
      };
      
      const { data, error } = await supabase
        .from('nutrition_timeline_events')
        .insert({
          user_id: user.id,
          title: newEvent.title,
          date: newEvent.date,
          description: newEvent.description,
          type: newEvent.type,
          completed: newEvent.completed
        })
        .select()
        .single();
        
      if (error) throw error;
      
      newEvent.id = data.id;
      
      setTimelineEvents(prev => [...prev, newEvent].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ));
      
      setShowNewEvent(false);
      setNewEventTitle('');
      setNewEventDate('');
      
      toast({
        title: "Event Added",
        description: `New ${newEventType} added to your timeline`,
      });
    } catch (error) {
      console.error('Error adding timeline event:', error);
      toast({
        title: "Error Adding Event",
        description: "There was a problem adding your event",
        variant: "destructive"
      });
    }
  };

  const toggleEventCompletion = async (id: string) => {
    if (!user) return;
    
    try {
      const event = timelineEvents.find(e => e.id === id);
      if (!event) return;
      
      const updatedCompleted = !event.completed;
      
      const { error } = await supabase
        .from('nutrition_timeline_events')
        .update({ completed: updatedCompleted })
        .eq('id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setTimelineEvents(prev => 
        prev.map(event => 
          event.id === id ? { ...event, completed: updatedCompleted } : event
        )
      );
      
      toast({
        title: updatedCompleted ? "Event Completed" : "Event Marked Incomplete",
        description: `${event.title} has been updated`,
      });
    } catch (error) {
      console.error('Error updating event completion:', error);
      toast({
        title: "Error Updating Event",
        description: "There was a problem updating the event",
        variant: "destructive"
      });
    }
  };

  const calculatePercentage = (current: number, target: number) => {
    return Math.min(100, Math.round((current / target) * 100));
  };

  const calculateWeeklyCompletionData = () => {
    const daysCompleted = history.length > 0 ? Math.min(7, history.length) : 0;
    
    return {
      daysCompleted,
      totalDays: 7
    };
  };

  const weeklyData = calculateWeeklyCompletionData();

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-md mx-auto mb-6">
          <TabsTrigger value="goals" className="data-[state=active]:bg-health-primary data-[state=active]:text-white">
            Goals
          </TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-health-primary data-[state=active]:text-white">
            Progress
          </TabsTrigger>
          <TabsTrigger value="timeline" className="data-[state=active]:bg-health-primary data-[state=active]:text-white">
            Timeline
          </TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-health-primary data-[state=active]:text-white">
            History
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="goals">
          <Alert className="mb-6 bg-health-light border-green-100">
            <Info className="h-5 w-5 text-health-primary" />
            <AlertDescription className="text-gray-700">
              <div className="space-y-2">
                <p className="font-medium text-lg">How to Use Nutrition Goals</p>
                <p className="text-sm md:text-base">
                  Nutrition goals help you track your daily intake and stay accountable. Set personalized targets for calories, protein, carbs, and fat based on your specific needs.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                  <li>Click <strong>Set Goals</strong> to customize your nutrition targets</li>
                  <li>Goals are automatically compared to your daily food entries</li>
                  <li>Progress bars show how close you are to meeting each goal</li>
                  <li>Your goals are saved and remembered each time you return</li>
                </ul>
                <p className="text-sm md:text-base pt-2">
                  <strong>Benefits:</strong> Setting specific nutrition goals helps you maintain a balanced diet, supports your fitness objectives, and makes it easier to track your progress over time.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-health-primary" />
                      Nutrition Goals
                    </CardTitle>
                    <CardDescription>Set and track your daily nutrition targets</CardDescription>
                  </div>
                  {isPremium && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingGoals(!isEditingGoals)}
                      className="flex items-center gap-1"
                    >
                      {isEditingGoals ? <Save className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                      {isEditingGoals ? 'Save Goals' : 'Set Goals'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="space-y-6">
                    {isEditingGoals ? (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(saveGoals)} className="space-y-4">
                          <FormField
                            control={form.control}
                            name="caloriesTarget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Calories Target (kcal)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="proteinTarget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Protein Target (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="carbsTarget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Carbs Target (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="fatTarget"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Fat Target (g)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="flex gap-2 justify-end">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={() => setIsEditingGoals(false)}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" className="bg-health-primary hover:bg-health-primary/90">
                              Save Goals
                            </Button>
                          </div>
                        </form>
                      </Form>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <Label htmlFor="calories">Calories: {goals.calories.target} kcal</Label>
                            <span className="text-sm text-muted-foreground">
                              {calculatePercentage(goals.calories.current, goals.calories.target)}%
                            </span>
                          </div>
                          <Progress 
                            value={calculatePercentage(goals.calories.current, goals.calories.target)} 
                            className="h-2 bg-green-100" 
                            indicatorClassName="bg-green-500" 
                          />
                          <div className="text-xs text-right text-muted-foreground">
                            {goals.calories.current} of {goals.calories.target} kcal
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <Label htmlFor="protein">Protein: {goals.protein.target}g</Label>
                            <span className="text-sm text-muted-foreground">
                              {calculatePercentage(goals.protein.current, goals.protein.target)}%
                            </span>
                          </div>
                          <Progress 
                            value={calculatePercentage(goals.protein.current, goals.protein.target)} 
                            className="h-2 bg-blue-100" 
                            indicatorClassName="bg-blue-500" 
                          />
                          <div className="text-xs text-right text-muted-foreground">
                            {goals.protein.current} of {goals.protein.target}g
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <Label htmlFor="carbs">Carbs: {goals.carbs.target}g</Label>
                            <span className="text-sm text-muted-foreground">
                              {calculatePercentage(goals.carbs.current, goals.carbs.target)}%
                            </span>
                          </div>
                          <Progress 
                            value={calculatePercentage(goals.carbs.current, goals.carbs.target)} 
                            className="h-2 bg-purple-100" 
                            indicatorClassName="bg-purple-500" 
                          />
                          <div className="text-xs text-right text-muted-foreground">
                            {goals.carbs.current} of {goals.carbs.target}g
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <Label htmlFor="fat">Fat: {goals.fat.target}g</Label>
                            <span className="text-sm text-muted-foreground">
                              {calculatePercentage(goals.fat.current, goals.fat.target)}%
                            </span>
                          </div>
                          <Progress 
                            value={calculatePercentage(goals.fat.current, goals.fat.target)} 
                            className="h-2 bg-yellow-100" 
                            indicatorClassName="bg-yellow-500" 
                          />
                          <div className="text-xs text-right text-muted-foreground">
                            {goals.fat.current} of {goals.fat.target}g
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="relative space-y-4 overflow-hidden">
                    <div className="bg-gray-100 h-12 rounded-md blur-sm"></div>
                    <div className="bg-gray-100 h-12 rounded-md blur-sm"></div>
                    <div className="bg-gray-100 h-12 rounded-md blur-sm"></div>
                    <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Lock className="h-8 w-8 text-health-primary mb-2" />
                      <p className="text-sm text-gray-200 max-w-[200px] text-center">
                        Upgrade to premium to set custom nutrition goals
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart4 className="h-5 w-5 text-health-primary" />
                  Daily Progress
                </CardTitle>
                <CardDescription>Track your progress against today's goals</CardDescription>
              </CardHeader>
              <CardContent>
                {isPremium ? (
                  <div className="grid grid-cols-2 gap-4">
                    <NutritionCard 
                      title="Calories" 
                      value={goals.calories.current} 
                      unit="kcal" 
                      color="green" 
                      goal={goals.calories.target} 
                    />
                    <NutritionCard 
                      title="Protein" 
                      value={goals.protein.current} 
                      unit="g" 
                      color="blue" 
                      goal={goals.protein.target} 
                    />
                    <NutritionCard 
                      title="Carbs" 
                      value={goals.carbs.current} 
                      unit="g" 
                      color="purple" 
                      goal={goals.carbs.target} 
                    />
                    <NutritionCard 
                      title="Fat" 
                      value={goals.fat.current} 
                      unit="g" 
                      color="yellow" 
                      goal={goals.fat.target} 
                    />
                  </div>
                ) : (
                  <div className="relative h-40 overflow-hidden">
                    <div className="h-40 bg-gray-100 rounded-md blur-sm"></div>
                    <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                      <Lock className="h-8 w-8 text-health-primary mb-2" />
                      <p className="text-sm text-gray-200 max-w-[200px] text-center">
                        Upgrade to premium to track your nutrition progress
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="progress">
          <Alert className="mb-6 bg-health-light border-green-100">
            <Info className="h-5 w-5 text-health-primary" />
            <AlertDescription className="text-gray-700">
              <div className="space-y-2">
                <p className="font-medium text-lg">Track Your Progress</p>
                <p className="text-sm md:text-base">
                  The Progress tab gives you a detailed overview of how well you're meeting your nutrition goals and maintaining consistency over time.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                  <li>View detailed nutrient breakdowns for each day</li>
                  <li>Monitor your weekly consistency with the completion rate tracker</li>
                  <li>Identify patterns in your nutrition habits</li>
                  <li>Celebrate small wins to build lasting habits</li>
                </ul>
                <p className="text-sm md:text-base pt-2">
                  <strong>Benefits:</strong> Tracking your progress helps maintain motivation, identify areas for improvement, and make data-driven adjustments to your nutrition plan for better results.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
              <CardDescription>Track your journey towards your nutrition goals</CardDescription>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Daily Nutrient Breakdown</h3>
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Calories</span>
                          <span>{goals.calories.current}/{goals.calories.target} kcal</span>
                        </div>
                        <Progress 
                          value={calculatePercentage(goals.calories.current, goals.calories.target)} 
                          className="h-2 bg-green-100" 
                          indicatorClassName="bg-green-500" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Protein</span>
                          <span>{goals.protein.current}/{goals.protein.target}g</span>
                        </div>
                        <Progress 
                          value={calculatePercentage(goals.protein.current, goals.protein.target)} 
                          className="h-2 bg-blue-100" 
                          indicatorClassName="bg-blue-500" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Carbs</span>
                          <span>{goals.carbs.current}/{goals.carbs.target}g</span>
                        </div>
                        <Progress 
                          value={calculatePercentage(goals.carbs.current, goals.carbs.target)} 
                          className="h-2 bg-purple-100" 
                          indicatorClassName="bg-purple-500" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Fat</span>
                          <span>{goals.fat.current}/{goals.fat.target}g</span>
                        </div>
                        <Progress 
                          value={calculatePercentage(goals.fat.current, goals.fat.target)} 
                          className="h-2 bg-yellow-100" 
                          indicatorClassName="bg-yellow-500" 
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Weekly Completion Rate</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 7 }).map((_, i) => {
                          const isComplete = i < weeklyData.daysCompleted;
                          return (
                            <div key={i} className="flex flex-col items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isComplete ? 'bg-health-primary text-white' : 'bg-gray-200'}`}>
                                {isComplete && <CheckCircle2 className="h-5 w-5" />}
                              </div>
                              <span className="text-xs mt-1">Day {i + 1}</span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 text-center text-sm text-gray-600">
                        {weeklyData.daysCompleted} out of {weeklyData.totalDays} days completed this week
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="relative h-60 overflow-hidden">
                  <div className="h-60 bg-gray-100 rounded-md blur-sm"></div>
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Lock className="h-8 w-8 text-health-primary mb-2" />
                    <p className="text-sm text-gray-200 max-w-[200px] text-center">
                      Upgrade to premium to track your nutrition progress
                    </p>
                    <Button className="mt-4 bg-health-primary hover:bg-health-primary/90">
                      Upgrade Now
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="timeline">
          <Alert className="mb-6 bg-health-light border-green-100">
            <Info className="h-5 w-5 text-health-primary" />
            <AlertDescription className="text-gray-700">
              <div className="space-y-2">
                <p className="font-medium text-lg">Plan Your Nutrition Journey</p>
                <p className="text-sm md:text-base">
                  The Timeline feature helps you plan and organize your nutrition goals over time, creating a roadmap for your health journey.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                  <li>Add <strong>Goals</strong> for long-term objectives you want to achieve</li>
                  <li>Create <strong>Milestones</strong> to mark significant achievements along the way</li>
                  <li>Set <strong>Checkpoints</strong> for regular progress reviews</li>
                  <li>Mark items as complete as you progress through your journey</li>
                </ul>
                <p className="text-sm md:text-base pt-2">
                  <strong>Benefits:</strong> Having a timeline creates structure, helps break big goals into manageable steps, and provides a visual representation of your progress that keeps you motivated and accountable.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-health-primary" />
                    Goal Timeline
                  </CardTitle>
                  <CardDescription>Plan your nutrition goals over time</CardDescription>
                </div>
                {isPremium && (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setShowNewEvent(!showNewEvent)}
                  >
                    {showNewEvent ? <MinusCircle className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                    {showNewEvent ? 'Cancel' : 'Add Event'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <div className="space-y-6">
                  {showNewEvent && (
                    <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-6">
                      <h3 className="font-medium">Add New Timeline Event</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="eventTitle">Event Title</Label>
                          <Input 
                            id="eventTitle"
                            value={newEventTitle}
                            onChange={(e) => setNewEventTitle(e.target.value)}
                            placeholder="e.g., Increase protein intake"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="eventDate">Target Date</Label>
                          <Input 
                            id="eventDate"
                            type="date"
                            value={newEventDate}
                            onChange={(e) => setNewEventDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Event Type</Label>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            type="button"
                            variant={newEventType === 'goal' ? 'default' : 'outline'} 
                            onClick={() => setNewEventType('goal')}
                            className="flex items-center gap-2"
                          >
                            <Target className="h-4 w-4" />
                            Goal
                          </Button>
                          <Button 
                            type="button"
                            variant={newEventType === 'milestone' ? 'default' : 'outline'} 
                            onClick={() => setNewEventType('milestone')}
                            className="flex items-center gap-2"
                          >
                            <BadgeCheck className="h-4 w-4" />
                            Milestone
                          </Button>
                          <Button 
                            type="button"
                            variant={newEventType === 'checkpoint' ? 'default' : 'outline'} 
                            onClick={() => setNewEventType('checkpoint')}
                            className="flex items-center gap-2"
                          >
                            <Clock className="h-4 w-4" />
                            Checkpoint
                          </Button>
                        </div>
                      </div>
                      <Button 
                        className="w-full bg-health-primary hover:bg-health-primary/90" 
                        onClick={addTimelineEvent}
                      >
                        Add to Timeline
                      </Button>
                    </div>
                  )}
                  
                  {timelineEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium text-gray-700">No Timeline Events Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Add your first nutrition goal or milestone by clicking the "Add Event" button
                      </p>
                    </div>
                  ) : (
                    <div className="relative space-y-6 pl-6 before:absolute before:inset-0 before:left-3 before:top-6 before:w-0.5 before:bg-gray-200 before:bottom-6">
                      {timelineEvents.map((event) => (
                        <div key={event.id} className="relative">
                          <div 
                            className={`absolute left-[-24px] flex items-center justify-center w-6 h-6 rounded-full ${
                              event.type === 'goal' ? 'bg-green-100' : 
                              event.type === 'milestone' ? 'bg-blue-100' : 'bg-purple-100'
                            }`}
                          >
                            {event.type === 'goal' ? (
                              <Target className={`h-3 w-3 ${event.type === 'goal' ? 'text-green-600' : ''}`} />
                            ) : event.type === 'milestone' ? (
                              <BadgeCheck className="h-3 w-3 text-blue-600" />
                            ) : (
                              <Clock className="h-3 w-3 text-purple-600" />
                            )}
                          </div>
                          
                          <div className={`relative border rounded-lg p-4 ${
                            event.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                          }`}>
                            <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                <div className="flex items-center">
                                  <h4 className={`font-semibold ${event.completed ? 'text-gray-500 line-through' : ''}`}>
                                    {event.title}
                                  </h4>
                                  {event.completed && (
                                    <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                      Completed
                                    </span>
                                  )}
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(event.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleEventCompletion(event.id)}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle2 className={`h-5 w-5 ${event.completed ? 'text-green-500' : 'text-gray-300'}`} />
                              </Button>
                            </div>
                            <p className="mt-2 text-sm text-gray-600">
                              {event.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-40 overflow-hidden">
                  <div className="h-40 bg-gray-100 rounded-md blur-sm"></div>
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Lock className="h-8 w-8 text-health-primary mb-2" />
                    <p className="text-sm text-gray-200 max-w-[200px] text-center">
                      Upgrade to premium to plan your nutrition journey
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Alert className="mb-6 bg-health-light border-green-100">
            <Info className="h-5 w-5 text-health-primary" />
            <AlertDescription className="text-gray-700">
              <div className="space-y-2">
                <p className="font-medium text-lg">Review Your Nutrition History</p>
                <p className="text-sm md:text-base">
                  The History tab provides insights into your past nutrition data, helping you understand long-term patterns and make informed decisions.
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm md:text-base">
                  <li>View detailed nutrition breakdowns for recent days</li>
                  <li>Analyze weekly averages to spot trends</li>
                  <li>Compare data across different time periods</li>
                  <li>Use historical data to refine your nutrition approach</li>
                </ul>
                <p className="text-sm md:text-base pt-2">
                  <strong>Benefits:</strong> Reviewing your nutrition history helps identify what's working and what isn't, understand how your body responds to different nutrition approaches, and make evidence-based adjustments to your diet plan.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Nutrition History</CardTitle>
              <CardDescription>Review your past nutrition data and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <div className="space-y-6">
                  {history.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart4 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium text-gray-700">No Nutrition Data Yet</h3>
                      <p className="text-gray-500 mb-4">
                        Start logging your meals to see your nutrition history here
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Recent Days</h3>
                        <div className="space-y-3">
                          {history.slice(0, 3).map((day, index) => {
                            const date = new Date(day.timestamp || Date.now()).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            });
                            
                            return (
                              <div key={index} className="p-4 rounded-lg border bg-white">
                                <div className="flex justify-between mb-2">
                                  <div className="font-medium">
                                    {date}
                                  </div>
                                  <div>
                                    <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                      Logged
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Calories</div>
                                    <div className="font-semibold">{day.calories}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Protein</div>
                                    <div className="font-semibold">{day.protein}g</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Carbs</div>
                                    <div className="font-semibold">{day.carbs}g</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-xs text-gray-500">Fat</div>
                                    <div className="font-semibold">{day.fat}g</div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {analyticsData.weeklyTrends.length > 0 && (
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Weekly Averages</h3>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Week
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg. Calories
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg. Protein
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg. Carbs
                                  </th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Avg. Fat
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {analyticsData.weeklyTrends.map((week, index) => (
                                  <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {week.week}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {week.calories} kcal
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {week.protein}g
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {week.carbs}g
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {week.fat}g
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="relative space-y-4 overflow-hidden">
                  <div className="bg-gray-100 h-16 rounded-md blur-sm"></div>
                  <div className="bg-gray-100 h-16 rounded-md blur-sm"></div>
                  <div className="bg-gray-100 h-16 rounded-md blur-sm"></div>
                  <div className="absolute inset-0 bg-gray-800/50 backdrop-blur-sm flex flex-col items-center justify-center">
                    <Lock className="h-8 w-8 text-health-primary mb-2" />
                    <p className="text-sm text-gray-200 max-w-[200px] text-center">
                      Upgrade to premium to access your complete nutrition history
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {!isPremium && (
        <div className="mt-8 bg-health-light border border-green-100 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Take Control of Your Nutrition Journey</h2>
          <p className="text-gray-600 mb-4">
            Set goals, track progress, and review your history with premium HealthTracker
          </p>
          <Button className="bg-health-primary hover:bg-health-primary/90">
            Upgrade to Premium
          </Button>
        </div>
      )}
    </div>
  );
};

export default HealthTracker;
