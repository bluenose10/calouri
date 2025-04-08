
import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-green-50 py-12 md:py-16">
      <div className="container mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          Calorie Calculator
        </h1>
        <div>
          <p className="text-lg text-health-primary">
            This Calorie Calculator will estimate the number of calories a person consumes each day.
            <span className="block mt-3 font-medium">Snap, Analyze, Track Your Nutrition</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
