
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const SUPABASE_URL = "https://cbjyshotohhjtyljthxz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNianlzaG90b2hoanR5bGp0aHh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM2ODAyMDQsImV4cCI6MjA1OTI1NjIwNH0.L3A0wkTEaRHcDc0D8R1jywYnI6F9MuHfpYkp8uwbEV8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
