
-- Create table for storing user nutrition goals
CREATE TABLE IF NOT EXISTS public.user_nutrition_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calories_target INTEGER NOT NULL DEFAULT 2000,
  protein_target INTEGER NOT NULL DEFAULT 75,
  carbs_target INTEGER NOT NULL DEFAULT 250,
  fat_target INTEGER NOT NULL DEFAULT 65,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Enable RLS on user_nutrition_goals
ALTER TABLE public.user_nutrition_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_nutrition_goals
CREATE POLICY "Users can view their own nutrition goals" 
  ON public.user_nutrition_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition goals" 
  ON public.user_nutrition_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition goals" 
  ON public.user_nutrition_goals
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create table for storing user timeline events
CREATE TABLE IF NOT EXISTS public.nutrition_timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('goal', 'milestone', 'checkpoint')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on nutrition_timeline_events
ALTER TABLE public.nutrition_timeline_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for nutrition_timeline_events
CREATE POLICY "Users can view their own timeline events" 
  ON public.nutrition_timeline_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own timeline events" 
  ON public.nutrition_timeline_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own timeline events" 
  ON public.nutrition_timeline_events
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own timeline events" 
  ON public.nutrition_timeline_events
  FOR DELETE
  USING (auth.uid() = user_id);
