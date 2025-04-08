
-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT false,
  is_free_trial BOOLEAN DEFAULT false,
  monthly_usage_count INTEGER NOT NULL DEFAULT 0,
  max_monthly_analyses INTEGER NOT NULL DEFAULT 10,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add Row Level Security to the table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow users to read their own subscription data
CREATE POLICY "Users can view their own subscription data"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create a policy for our edge functions to update subscription data
CREATE POLICY "Service role can manage all subscription data"
  ON public.user_subscriptions
  USING (true)
  WITH CHECK (true);
