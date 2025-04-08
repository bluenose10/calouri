import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';

export function usePremiumAccess() {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [isFreeTrial, setIsFreeTrial] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [daysRemaining, setDaysRemaining] = useState<number>(0);
  const [subscriptionTier, setSubscriptionTier] = useState<string>('free');
  const [monthlyUsage, setMonthlyUsage] = useState<number>(0);
  const [maxMonthlyAnalyses, setMaxMonthlyAnalyses] = useState<number>(10);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) {
        setIsPremium(false);
        setIsFreeTrial(false);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log("Checking premium status for user:", user.id);
        
        // Check if user has an active subscription
        const { data: subscriptions, error: subError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();

        if (subError) {
          console.error("Error fetching subscription:", subError);
          throw subError;
        }
        
        console.log("Subscription data:", subscriptions);
        
        // If user has an active subscription, they have premium access
        if (subscriptions) {
          console.log("User has an active subscription");
          setIsPremium(true);
          
          // Check if it's a free trial or a paid subscription
          // If there's a stripe_subscription_id, it's a paid subscription
          const isPaidSubscription = !!subscriptions.stripe_subscription_id;
          
          // Check for explicit is_free_trial property first (from webhook)
          if (subscriptions.hasOwnProperty('is_free_trial')) {
            setIsFreeTrial(!!subscriptions.is_free_trial);
          } else {
            // Otherwise, determine based on subscription ID presence
            setIsFreeTrial(!isPaidSubscription);
          }
          
          setSubscriptionTier(subscriptions.tier);
          setMonthlyUsage(subscriptions.monthly_usage_count);
          setMaxMonthlyAnalyses(subscriptions.max_monthly_analyses);
          
          // Set days remaining only for free trials
          if (!isPaidSubscription) {
            // Calculate days remaining in trial if no explicit end date
            if (!subscriptions.ends_at) {
              const { data: userData, error: userError } = await supabase.auth.getUser();
              
              if (userError || !userData.user) {
                console.error("Error getting user data:", userError);
                throw userError || new Error('User data not found');
              }
              
              const userCreatedAt = new Date(userData.user.created_at);
              const currentDate = new Date();
              const daysSinceCreation = differenceInDays(currentDate, userCreatedAt);
              const remaining = Math.max(0, 2 - daysSinceCreation);
              
              console.log("Days remaining in trial:", remaining);
              setDaysRemaining(remaining);
            }
          } else {
            // For paid subscriptions, don't show days remaining
            setDaysRemaining(0);
          }
          
          setIsLoading(false);
          return;
        }

        // If no active subscription, check if within 2-day trial period
        const { data: userData, error: userError } = await supabase.auth.getUser();
        
        if (userError || !userData.user) {
          console.error("Error getting user data:", userError);
          throw userError || new Error('User data not found');
        }
        
        const userCreatedAt = new Date(userData.user.created_at);
        const currentDate = new Date();
        const daysSinceCreation = differenceInDays(currentDate, userCreatedAt);
        const remaining = Math.max(0, 2 - daysSinceCreation);
        
        console.log("User created at:", userCreatedAt);
        console.log("Days since creation:", daysSinceCreation);
        console.log("Days remaining in trial:", remaining);
        
        setDaysRemaining(remaining);
        setIsFreeTrial(remaining > 0);
        setIsPremium(remaining > 0); // User has premium access during trial period
        
        // If user doesn't have a subscription record yet, create one
        if (remaining > 0) {
          console.log("Creating user subscription record for free trial");
          await createOrUpdateUserSubscription(user.id, true, true); // is_active=true, is_free_trial=true
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
        toast.error('Failed to check subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user]);

  // Helper to create or update user subscription
  const createOrUpdateUserSubscription = async (userId: string, isActive: boolean, isFreeTrial: boolean = false) => {
    try {
      console.log("Creating/updating user subscription:", { userId, isActive, isFreeTrial });
      const { error } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          tier: 'free',
          is_active: isActive,
          is_free_trial: isFreeTrial,
          starts_at: new Date().toISOString(),
          ends_at: isActive && !isFreeTrial ? null : new Date().toISOString(),
          monthly_usage_count: 0,
          max_monthly_analyses: 10
        });
      
      if (error) {
        console.error("Error upserting subscription:", error);
        throw error;
      }
      
      console.log("User subscription created/updated successfully");
    } catch (error) {
      console.error('Error creating/updating user subscription record:', error);
    }
  };

  // Function to increment usage count
  const incrementUsage = async () => {
    if (!user) return false;
    
    try {
      // Get current subscription record
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (!subscription) {
        console.error('No subscription record found');
        return false;
      }
      
      // Check if user has reached their limit
      if (subscription.monthly_usage_count >= subscription.max_monthly_analyses && !isPremium) {
        toast.error('You have reached your monthly limit. Please upgrade to continue.');
        return false;
      }
      
      // Increment usage count
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({ 
          monthly_usage_count: subscription.monthly_usage_count + 1 
        })
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setMonthlyUsage(prev => prev + 1);
      return true;
    } catch (error) {
      console.error('Error incrementing usage count:', error);
      return false;
    }
  };

  return { 
    isPremium, 
    isFreeTrial, 
    isLoading, 
    daysRemaining,
    subscriptionTier,
    monthlyUsage,
    maxMonthlyAnalyses,
    incrementUsage
  };
}
