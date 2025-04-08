
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardNavbar from '../components/DashboardNavbar';
import { supabase } from '../lib/supabase';
import Dashboard from '../components/Dashboard';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import SubscriptionBanner from '@/components/SubscriptionBanner';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    // Show successful payment message if redirected from Stripe
    const urlParams = new URLSearchParams(location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      toast.success('Payment successful! You now have access to all premium features.');
    } else if (paymentStatus === 'cancelled') {
      toast.error('Payment was cancelled. You can try again later.');
    }
    
    // Clean up the URL parameters
    if (paymentStatus) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [location]);
  
  return (
    <div className="min-h-screen bg-[hsl(var(--app-background))] pb-10">
      <DashboardNavbar />
      <main className="container mx-auto px-4 pt-6">
        <SubscriptionBanner />
        <Dashboard />
      </main>
    </div>
  );
};

export default DashboardPage;
