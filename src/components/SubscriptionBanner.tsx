
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { Clock, CreditCard, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const SubscriptionBanner: React.FC = () => {
  const { isPremium, isFreeTrial, daysRemaining, isLoading } = usePremiumAccess();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add console logs for debugging
  console.log("SubscriptionBanner - isPremium:", isPremium);
  console.log("SubscriptionBanner - isFreeTrial:", isFreeTrial);
  console.log("SubscriptionBanner - daysRemaining:", daysRemaining);
  console.log("SubscriptionBanner - user:", user?.id);
  
  const handleUpgrade = async () => {
    if (!user) {
      toast.error("You need to be logged in to upgrade");
      return;
    }
    
    try {
      setIsProcessing(true);
      toast.info("Setting up checkout...");
      
      console.log("Starting checkout process for user:", user.id);
      
      // First, check if the user already has a subscription record
      const { data: existingSubscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "no rows returned" error, which is fine for new users
        console.error("Error checking existing subscription:", fetchError);
        throw fetchError;
      }
      
      console.log("Existing subscription data:", existingSubscription);
      console.log("Creating checkout session...");
      
      // Call the Supabase Edge Function to create a Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          price: 399,
          existingCustomerId: existingSubscription?.stripe_customer_id || null 
        }
      });
      
      if (error) {
        console.error("Error from create-checkout function:", error);
        throw error;
      }
      
      console.log("Checkout response:", data);
      
      if (data?.url) {
        console.log("Redirecting to Stripe checkout:", data.url);
        
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned from edge function:", data);
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      toast.error("Failed to start checkout process. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Make sure we always show something during the loading state or when we have data
  if (isLoading) {
    return (
      <div className="bg-gray-100 border border-gray-200 p-4 rounded-lg mb-6 animate-pulse">
        <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  // Premium user with an active free trial
  if (isPremium && isFreeTrial) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 p-4 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <Clock className="h-5 w-5 text-amber-600 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800">
                Free Trial: <span className="font-bold">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span> remaining
              </h3>
              <p className="text-sm text-amber-700">Enjoy unlimited access to all premium features.</p>
            </div>
          </div>
          <Button 
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleUpgrade}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Upgrade Now ($3.99/month)'}
          </Button>
        </div>
      </div>
    );
  }
  
  // Premium user with a paid subscription
  if (isPremium && !isFreeTrial) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 p-4 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-3 sm:mb-0">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-emerald-800">Premium Subscription Active</h3>
              <p className="text-sm text-emerald-700">You have full access to all premium features.</p>
            </div>
          </div>
          <Button 
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
            onClick={() => navigate('/nutrichat')}
          >
            Explore Premium Features
          </Button>
        </div>
      </div>
    );
  }
  
  // Free user (trial ended)
  return (
    <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 p-4 rounded-lg mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-3 sm:mb-0">
          <CreditCard className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-gray-800">Your free trial has ended</h3>
            <p className="text-sm text-gray-600">Upgrade to access premium features like NutriChat, FoodInsights, and Health Tracker.</p>
          </div>
        </div>
        <Button 
          className="bg-health-primary hover:bg-health-primary/90"
          onClick={handleUpgrade}
          disabled={isProcessing}
        >
          {isProcessing ? 'Processing...' : 'Upgrade Now ($3.99/month)'}
        </Button>
      </div>
    </div>
  );
};

export default SubscriptionBanner;
