
import React from 'react';
import { Camera, BarChart3, LineChart } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const WhyChooseSection: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState("instant-recognition");
  
  return (
    <section className="py-12 container mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-8">Why Choose Calouri?</h2>
      
      <Tabs defaultValue="instant-recognition" className="w-full max-w-4xl mx-auto" onValueChange={setActiveTab}>
        <div className="px-4 md:px-0">
          <TabsList className="mb-6 flex justify-center">
            <TabsTrigger value="instant-recognition" className="flex-1 md:flex-initial text-xs md:text-sm text-center">
              <span className="hidden md:inline">Instant Recognition</span>
              <span className="md:hidden">AI Vision</span>
            </TabsTrigger>
            <TabsTrigger value="global-food-database" className="flex-1 md:flex-initial text-xs md:text-sm text-center">
              <span className="hidden md:inline">Global Food Database</span>
              <span className="md:hidden">Food DB</span>
            </TabsTrigger>
            <TabsTrigger value="nutrition-database" className="flex-1 md:flex-initial text-xs md:text-sm text-center">
              <span className="hidden md:inline">Nutrition Database</span>
              <span className="md:hidden">Nutrition</span>
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="px-4 md:px-0">
          <TabsContent value="instant-recognition">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/4 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
                  <Camera className="h-12 w-12 text-health-primary" />
                </div>
              </div>
              <div className="w-full md:w-3/4 text-center md:text-left">
                <h3 className="text-xl font-semibold mb-4 text-center md:text-left">INSTANT FOOD RECOGNITION</h3>
                <p className="text-gray-600 mb-4">
                  Simply snap a food photo and get the nutritional information of your meal instantly.
                </p>
                <p className="text-gray-600">
                  Calouri best free calorie counter app is powered by our advanced Food AI technology. Our system leverages the
                  innovations in deep learning image classification to accurately identify food items from your photos.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="global-food-database">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/4 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
                  <BarChart3 className="h-12 w-12 text-health-primary" />
                </div>
              </div>
              <div className="w-full md:w-3/4 text-center md:text-left">
                <h3 className="text-xl font-semibold mb-4 text-center md:text-left">IDENTIFY THOUSANDS OF FOOD CATEGORIES</h3>
                <p className="text-gray-600 mb-4">
                  Our calorie counter food AI has been trained on cuisine from all over the world and is the most
                  culturally diverse food identification system on the market.
                </p>
                <p className="text-gray-600">
                  This best calorie counter app accuracy improves as new food images are added to our
                  database, ensuring you always get the most precise nutritional information.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="nutrition-database">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-full md:w-1/4 flex justify-center">
                <div className="w-24 h-24 rounded-full bg-green-50 flex items-center justify-center">
                  <LineChart className="h-12 w-12 text-health-primary" />
                </div>
              </div>
              <div className="w-full md:w-3/4 text-center md:text-left">
                <h3 className="text-xl font-semibold mb-4 text-center md:text-left">COMPREHENSIVE NUTRITION DATABASE</h3>
                <p className="text-gray-600 mb-4">
                  Calouri is a maintenance calories calculator connected to vast food databases. Food item recognized is paired
                  with detailed nutrition information.
                </p>
                <p className="text-gray-600">
                  Our platform builds detailed nutritional user profiles and recommends customized
                  diets based on your personal health goals and eating patterns.
                </p>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </section>
  );
};

export default WhyChooseSection;
