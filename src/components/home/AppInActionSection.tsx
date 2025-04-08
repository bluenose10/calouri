
import React from 'react';

const AppInActionSection: React.FC = () => {
  return (
    <section className="py-12 container mx-auto">
      <h2 className="text-2xl font-semibold text-center mb-8">See Calouri in Action</h2>
      
      <div className="max-w-4xl mx-auto px-4 md:px-0">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-lg overflow-hidden shadow-md border border-gray-100">
            <div className="h-52 overflow-hidden">
              <img 
                src="/calorie-calculator.jpg"
                alt="Calorie Calculator" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 text-center">
              <p className="font-medium">Food Bowl - 450 calories</p>
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-md border border-gray-100">
            <div className="h-52 overflow-hidden">
              <img 
                src="/calories-calculator.jpg" 
                alt="Calories Calculator" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 text-center">
              <p className="font-medium">Fresh Salad - 320 calories</p>
            </div>
          </div>
          
          <div className="rounded-lg overflow-hidden shadow-md border border-gray-100">
            <div className="h-52 overflow-hidden">
              <img 
                src="/calorie-deficit-calculator.jpg" 
                alt="calorie deficit calculator" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-4 text-center">
              <p className="font-medium">Grilled Salmon - 390 calories</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppInActionSection;
