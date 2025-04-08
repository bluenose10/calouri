
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Apple } from 'lucide-react';

const GetStartedSection: React.FC = () => {
  return (
    <section className="py-12 bg-green-50">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between px-4 md:px-8">
          <div className="w-full md:w-2/3 mb-8 md:mb-0 text-center md:text-left">
            <h2 className="text-2xl font-semibold mb-4">Get Started Today</h2>
            <p className="text-gray-600 mb-6">
              Try our innovative calorie deficit calculator to help you reach your weight management goals.
              Join thousands of users who are transforming their relationship with food
              through data-driven insights and AI technology.
            </p>
            <Link to="/signup">
              <Button className="bg-health-primary hover:bg-health-primary/90">
                Create Your Free Account
              </Button>
            </Link>
          </div>
          <div className="w-full md:w-1/3 flex justify-center">
            <div className="w-32 h-32 flex items-center justify-center">
              <Apple className="w-24 h-24 text-health-primary" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GetStartedSection;
