
import { FoodItem } from '../types';
import { format, subDays } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Function to group food items by day
const groupByDay = (foodItems: FoodItem[]) => {
  const grouped: Record<string, FoodItem[]> = {};
  
  foodItems.forEach(item => {
    const date = format(new Date(item.timestamp), 'yyyy-MM-dd');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(item);
  });
  
  return grouped;
};

export const generateNutritionPDF = (foodItems: FoodItem[]) => {
  const doc = new jsPDF();
  // Apply autotable plugin
  autoTable(doc, {});
  
  const today = new Date();
  const sevenDaysAgo = subDays(today, 7);
  
  // Title
  doc.setFontSize(20);
  doc.text('Nutrition History Report', 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Generated on: ${format(today, 'MMMM d, yyyy')}`, 105, 25, { align: 'center' });
  doc.text(`Date range: ${format(sevenDaysAgo, 'MMM d')} - ${format(today, 'MMM d, yyyy')}`, 105, 32, { align: 'center' });

  // Group food items by day
  const groupedByDay = groupByDay(foodItems);
  
  // Sort days in reverse chronological order
  const sortedDays = Object.keys(groupedByDay).sort().reverse();
  
  let yOffset = 45;
  
  sortedDays.forEach((day, index) => {
    const items = groupedByDay[day];
    const formattedDate = format(new Date(day), 'EEEE, MMMM d, yyyy');
    
    // Start a new page if not enough space
    if (yOffset > 240 && index < sortedDays.length - 1) {
      doc.addPage();
      yOffset = 20;
    }
    
    // Day header
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(formattedDate, 14, yOffset);
    yOffset += 10;
    
    // Calculate daily totals
    const totals = items.reduce((acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
      fiber: acc.fiber + (item.fiber || 0),
      sugar: acc.sugar + (item.sugar || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 });
    
    // Daily summary
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Daily Totals: ${Math.round(totals.calories)} kcal | P: ${Math.round(totals.protein)}g | C: ${Math.round(totals.carbs)}g | F: ${Math.round(totals.fat)}g`, 14, yOffset);
    yOffset += 8;
    
    // Food items table
    const tableData = items.map(item => [
      item.name,
      item.mealType ? item.mealType.charAt(0).toUpperCase() + item.mealType.slice(1) : 'Meal',
      format(new Date(item.timestamp), 'h:mm a'),
      Math.round(item.calories),
      Math.round(item.protein),
      Math.round(item.carbs),
      Math.round(item.fat)
    ]);
    
    autoTable(doc, {
      head: [['Food', 'Meal Type', 'Time', 'Calories', 'Protein (g)', 'Carbs (g)', 'Fat (g)']],
      body: tableData,
      startY: yOffset,
      theme: 'grid',
      headStyles: { fillColor: [76, 175, 80] },
      styles: { fontSize: 10 }
    });
    
    yOffset = (doc as any).lastAutoTable.finalY + 15;
  });

  // Add disclaimer at the end
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('This report includes nutrition data for the last 7 days. Historical data is automatically removed from our system after 7 days.', 105, 280, { align: 'center', maxWidth: 180 });
  
  return doc;
};
