
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, AlertCircle, CreditCard, CheckCircle } from 'lucide-react';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface PremiumAccessBannerProps {
  feature?: string; // Optional feature name
}

const PremiumAccessBanner: React.FC<PremiumAccessBannerProps> = ({ feature }) => {
  const { isPremium, isFreeTrial, isLoading, daysRemaining } = usePremiumAccess();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  
  console.log("PremiumAccessBanner - isPremium:", isPremium);
  console.log("PremiumAccessBanner - isFreeTrial:", isFreeTrial);
  console.log("PremiumAccessBanner - daysRemaining:", daysRemaining);
  console.log("PremiumAccessBanner - user:", user?.id);
  
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
  
  if (isLoading) {
    return (
      <div className="bg-gray-100 border border-gray-200 p-3 rounded-md mb-4 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }
  
  // Fully paid premium user (not free trial)
  if (isPremium && !isFreeTrial) {
    return (
      <div className="bg-green-50 border border-green-200 p-3 rounded-md mb-4">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <h3 className="font-medium text-green-700">
            Premium Subscription Active
          </h3>
        </div>
        <p className="text-sm text-green-600 mt-1">
          You have full access to all premium features.
        </p>
      </div>
    );
  }
  
  // Free trial user
  if (isPremium && isFreeTrial) {
    return (
      <div className="bg-amber-50 border border-amber-200 p-3 rounded-md mb-4">
        <div className="flex items-center">
          <Clock className="h-5 w-5 text-amber-500 mr-2" />
          <h3 className="font-medium text-amber-700">
            Free Trial: <span className="font-bold">{daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}</span> remaining
          </h3>
        </div>
        <p className="text-sm text-amber-600 mt-1">Enjoy premium features during your trial period.</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
          onClick={handleUpgrade}
          disabled={isProcessing}
        >
          <CreditCard className="h-4 w-4 mr-1" />
          {isProcessing ? 'Processing...' : 'Upgrade Now ($3.99/month)'}
        </Button>
      </div>
    );
  }
  
  // Free user (trial ended)
  return (
    <div className="bg-gray-50 border border-gray-200 p-3 rounded-md mb-4">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-gray-500 mr-2" />
        <h3 className="font-medium text-gray-700">Premium Access Required</h3>
      </div>
      <p className="text-sm text-gray-600 mt-1">Your free trial has ended. Upgrade to continue using premium features.</p>
      <Button 
        variant="default" 
        size="sm" 
        className="mt-2 bg-health-primary hover:bg-health-primary/90"
        onClick={handleUpgrade}
        disabled={isProcessing}
      >
        <CreditCard className="h-4 w-4 mr-1" />
        {isProcessing ? 'Processing...' : 'Upgrade Now ($3.99/month)'}
      </Button>
    </div>
  );
};

export default PremiumAccessBanner;
