
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useFoodContext } from '../context/FoodContext';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { format, addDays, subDays, isSameDay, isToday, isPast, differenceInDays } from 'date-fns';
import { Filter, Trash2, Calendar, Download, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import NutritionSummary from './NutritionSummary';
import MacronutrientChart from './MacronutrientChart';
import { FoodItem } from '../types';
import { generateNutritionPDF } from '../lib/generatePDF';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const History: React.FC = () => {
  const { history, deleteFromHistory, retentionDays } = useFoodContext();
  const [selectedMealType, setSelectedMealType] = useState<string | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const { isMobile } = useIsMobile();
  const tabsRef = useRef<HTMLDivElement>(null);
  const tabsContentRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  const calendarDays = useMemo(() => {
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < Math.min(retentionDays, 7); i++) {
      const date = i === 0 ? today : addDays(today, i);
      const fullDayLabel = format(date, isToday(date) ? "'Today'" : 'EEEE');
      const shortDayLabel = format(date, isToday(date) ? "'Today'" : 'EEE');
      
      days.push({
        date,
        label: fullDayLabel,
        shortLabel: shortDayLabel,
        formattedDate: format(date, 'MMM d')
      });
    }
    
    return days;
  }, [retentionDays]);

  const foodByDay = useMemo(() => {
    return calendarDays.map(day => {
      const dayItems = history.filter(item => {
        const itemDate = new Date(item.timestamp);
        return isSameDay(itemDate, day.date);
      }).filter(item => {
        return !selectedMealType || item.mealType === selectedMealType;
      });
      
      const dailyTotals = dayItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
          fiber: acc.fiber + (item.fiber || 0),
          sugar: acc.sugar + (item.sugar || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 }
      );
      
      return {
        ...day,
        items: dayItems,
        totals: dailyTotals
      };
    });
  }, [history, calendarDays, selectedMealType]);

  const todayItems = useMemo(() => {
    const today = new Date();
    return history.filter(item => {
      const itemDate = new Date(item.timestamp || new Date());
      return isSameDay(itemDate, today);
    });
  }, [history]);

  const handleTabChange = (tabIndex: string) => {
    if (isMobile) {
      scrollPositionRef.current = window.scrollY;
    }
    
    const newIndex = parseInt(tabIndex);
    setActiveTabIndex(newIndex);
    
    if (isMobile && tabsRef.current) {
      requestAnimationFrame(() => {
        if (scrollPositionRef.current > 0) {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'instant'
          });
        }
        
        const tabTriggers = tabsRef.current.querySelectorAll('[data-state]');
        if (tabTriggers && tabTriggers[newIndex]) {
          const tabsList = tabsRef.current;
          const selectedTab = tabTriggers[newIndex] as HTMLElement;
          const tabsListRect = tabsList.getBoundingClientRect();
          const selectedTabRect = selectedTab.getBoundingClientRect();
          
          const scrollLeft = selectedTabRect.left - tabsListRect.left - 
            (tabsListRect.width / 2) + (selectedTabRect.width / 2);
            
          tabsList.scrollLeft = scrollLeft;
        }
      });
    }
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generateNutritionPDF(history);
      doc.save('nutrition-history.pdf');
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  const navigatePrev = () => {
    if (activeTabIndex > 0) {
      if (isMobile) {
        scrollPositionRef.current = window.scrollY;
      }
      setActiveTabIndex(activeTabIndex - 1);
    }
  };

  const navigateNext = () => {
    if (activeTabIndex < calendarDays.length - 1) {
      if (isMobile) {
        scrollPositionRef.current = window.scrollY;
      }
      setActiveTabIndex(activeTabIndex + 1);
    }
  };

  useEffect(() => {
    if (isMobile && scrollPositionRef.current > 0) {
      window.scrollTo({
        top: scrollPositionRef.current,
        behavior: 'instant'
      });
    }
  }, [activeTabIndex, isMobile]);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Food History</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" /> 
            Filter
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="bg-health-primary hover:bg-health-primary/90"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4 mr-2" /> 
            Download PDF
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="space-y-2">
              <Select value={selectedMealType} onValueChange={setSelectedMealType}>
                <SelectTrigger id="meal-type-filter" className="w-[200px]">
                  <SelectValue placeholder="All meal types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={undefined}>All meal types</SelectItem>
                  <SelectItem value="breakfast">Breakfast</SelectItem>
                  <SelectItem value="lunch">Lunch</SelectItem>
                  <SelectItem value="dinner">Dinner</SelectItem>
                  <SelectItem value="snack">Snack</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedMealType(undefined)}
                className="ml-2"
              >
                Reset Filter
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> 7-Day Nutrition History
            </CardTitle>
            <CardDescription>
              View your daily nutrition intake for the past week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs 
              value={activeTabIndex.toString()} 
              onValueChange={handleTabChange} 
              className="w-full"
            >
              <div 
                ref={tabsRef} 
                className="relative overflow-x-auto no-scrollbar"
              >
                <TabsList className="w-full mb-2 overflow-x-auto no-scrollbar flex">
                  {calendarDays.map((day, index) => (
                    <TabsTrigger 
                      key={index} 
                      value={index.toString()}
                      className="flex flex-col py-2"
                    >
                      <span className="font-medium">
                        {isMobile ? day.shortLabel : day.label}
                      </span>
                      <span className="text-xs text-muted-foreground">{day.formattedDate}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              {isMobile && (
                <div className="mb-4 mt-2 flex items-center justify-center gap-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={navigatePrev}
                    disabled={activeTabIndex === 0}
                    className="flex-shrink-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 max-w-xs text-center">
                    <span className="text-sm font-medium">
                      {calendarDays[activeTabIndex]?.label} ({calendarDays[activeTabIndex]?.formattedDate})
                    </span>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={navigateNext}
                    disabled={activeTabIndex === calendarDays.length - 1}
                    className="flex-shrink-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div 
                ref={tabsContentRef} 
                style={{
                  minHeight: '200px',
                  position: 'relative'
                }}
              >
                {calendarDays.map((day, index) => {
                  const dayItems = foodByDay.find(item => item.date.getTime() === day.date.getTime());
                  
                  return (
                    <TabsContent 
                      key={index} 
                      value={index.toString()}
                      className="focus:outline-none mt-0"
                      style={{
                        display: activeTabIndex === index ? 'block' : 'none'
                      }}
                    >
                      <div className="space-y-6">
                        <div>
                          <h3 className="font-medium text-lg mb-3">Meals ({dayItems?.items.length || 0})</h3>
                          {!dayItems || dayItems.items.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg">
                              <p className="text-gray-500">No food entries for {day.label}</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {dayItems.items.map((item) => (
                                <Card key={item.id} className="overflow-hidden group">
                                  <CardContent className="p-4">
                                    <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-2 sm:gap-4`}>
                                      {item.imageUrl && (
                                        <div className="flex-shrink-0 flex justify-center items-center mx-auto">
                                          <img 
                                            src={item.imageUrl} 
                                            alt={item.name} 
                                            className="w-20 h-20 object-cover rounded-md"
                                          />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0 text-center">
                                        <p className="font-medium text-gray-900 truncate">{item.name}</p>
                                        <div className="flex justify-center gap-2 mt-1">
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {item.mealType?.charAt(0).toUpperCase() + (item.mealType?.slice(1) || '')}
                                          </span>
                                          <span className="inline-flex items-center text-xs text-gray-500">
                                            {item.timestamp ? new Date(item.timestamp).toLocaleString(undefined, { 
                                              hour: '2-digit', 
                                              minute: '2-digit' 
                                            }) : ''}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <p className="text-lg font-bold text-health-primary">{Math.round(item.calories)} kcal</p>
                                        <div className="flex justify-center gap-2 text-xs text-gray-500">
                                          <span>P {Math.round((item.protein * 4 / (item.calories || 1)) * 100)}%</span>
                                          <span>C {Math.round((item.carbs * 4 / (item.calories || 1)) * 100)}%</span>
                                          <span>F {Math.round((item.fat * 9 / (item.calories || 1)) * 100)}%</span>
                                        </div>
                                      </div>
                                      <div className="flex justify-center">
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="opacity-100"
                                          onClick={() => item.id && deleteFromHistory(item.id)}
                                        >
                                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </TabsContent>
                  );
                })}
              </div>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default History;
