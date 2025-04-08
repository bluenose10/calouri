
import React from 'react';
import DashboardNavbar from '../components/DashboardNavbar';
import { useAuth } from '../context/AuthContext';
import FoodInsights from '../components/premium/FoodInsights';
import PremiumAccessBanner from '../components/premium/PremiumAccessBanner';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, LineChart } from 'lucide-react';

const FoodInsightsPage: React.FC = () => {
  const { user } = useAuth();
  const { isPremium } = usePremiumAccess();
  
  if (!user) return null;
  
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--app-background))]">
      <DashboardNavbar />
      <main className="container mx-auto px-4 pt-6 pb-10 flex-grow">
        <SubscriptionBanner />
        {isPremium ? <FoodInsights /> : <PremiumAccessBanner />}
      </main>
      
      {isPremium && (
        <div className="bg-green-50 py-6 border-t border-green-100">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link to="/dashboard" className="w-full">
                <Button variant="outline" className="w-full h-14 bg-white text-health-primary hover:text-health-primary hover:bg-white/80 border-green-200 hover:border-health-primary">
                  <LayoutDashboard className="mr-2 h-5 w-5" />
                  Back to Dashboard
                </Button>
              </Link>
              <Link to="/healthtracker" className="w-full">
                <Button variant="outline" className="w-full h-14 bg-white text-health-primary hover:text-health-primary hover:bg-white/80 border-green-200 hover:border-health-primary">
                  <LineChart className="mr-2 h-5 w-5" />
                  HealthTracker
                </Button>
              </Link>
              <Link to="/nutrichat" className="w-full">
                <Button variant="outline" className="w-full h-14 bg-white text-health-primary hover:text-health-primary hover:bg-white/80 border-green-200 hover:border-health-primary">
                  <MessageSquare className="mr-2 h-5 w-5" />
                  NutriChat
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
};

export default FoodInsightsPage;
