
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, BarChart3, LineChart } from 'lucide-react';

const BrandingSection: React.FC = () => {
  return (
    <section className="py-12 container mx-auto text-center">
      <h2 className="text-5xl font-bold text-health-primary mb-4">Calouri</h2>
      <h3 className="text-3xl font-bold text-gray-800 mb-8">AI-Powered Nutrition Tracking</h3>
      
      <p className="max-w-2xl mx-auto text-gray-600 text-lg mb-10">
        Take a photo of your food and instantly get detailed nutrition information. Our advanced calories calculator 
        helps you track your meals, monitor your macros, and achieve your health goals.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
        <Link to="/signup">
          <Button className="bg-health-primary hover:bg-health-primary/90 px-6 py-3 h-auto text-base">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
              Sign up free
            </span>
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" className="border-health-primary text-health-primary px-6 py-3 h-auto text-base">
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Log in
            </span>
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4 md:px-0">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-health-primary" />
          </div>
          <h4 className="text-xl font-semibold mb-3">Snap & Track</h4>
          <p className="text-gray-600">
            Take a photo of your meal and our AI instantly identifies the food and
            calculates nutrition.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 text-health-primary" />
          </div>
          <h4 className="text-xl font-semibold mb-3">Smart Analytics</h4>
          <p className="text-gray-600">
            Visualize your nutrition intake with beautiful charts and get insights on
            your eating habits.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <LineChart className="h-8 w-8 text-health-primary" />
          </div>
          <h4 className="text-xl font-semibold mb-3">Progress Tracking</h4>
          <p className="text-gray-600">
            Set nutrition goals and track your progress over time with detailed
            history and trends.
          </p>
        </div>
      </div>
    </section>
  );
};

export default BrandingSection;
