
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          weight_kg: number | null;
          height_cm: number | null;
          age: number | null;
          gender: string | null;
          activity_level: string | null;
          goal: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          age?: number | null;
          gender?: string | null;
          activity_level?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string | null;
          weight_kg?: number | null;
          height_cm?: number | null;
          age?: number | null;
          gender?: string | null;
          activity_level?: string | null;
          goal?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      food_entries: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          timestamp: string;
          meal_type: string | null;
          notes: string | null;
          quantity: number | null;
          fiber: number | null;
          sugar: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          timestamp?: string;
          meal_type?: string | null;
          notes?: string | null;
          quantity?: number | null;
          fiber?: number | null;
          sugar?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          timestamp?: string;
          meal_type?: string | null;
          notes?: string | null;
          quantity?: number | null;
          fiber?: number | null;
          sugar?: number | null;
        };
      };
      food_analyses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          image_url: string | null;
          created_at: string;
          meal_type: string | null;
          notes: string | null;
          fiber: number | null;
          sugar: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          calories: number;
          protein: number;
          carbs: number;
          fat: number;
          image_url?: string | null;
          created_at?: string;
          meal_type?: string | null;
          notes?: string | null;
          fiber?: number | null;
          sugar?: number | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          calories?: number;
          protein?: number;
          carbs?: number;
          fat?: number;
          image_url?: string | null;
          created_at?: string;
          meal_type?: string | null;
          notes?: string | null;
          fiber?: number | null;
          sugar?: number | null;
        };
      };
      user_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: string;
          starts_at: string;
          ends_at: string | null;
          is_active: boolean;
          monthly_usage_count: number;
          max_monthly_analyses: number;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: string;
          starts_at?: string;
          ends_at?: string | null;
          is_active?: boolean;
          monthly_usage_count?: number;
          max_monthly_analyses: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: string;
          starts_at?: string;
          ends_at?: string | null;
          is_active?: boolean;
          monthly_usage_count?: number;
          max_monthly_analyses?: number;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_nutrition_goals: {
        Row: {
          id: string;
          user_id: string;
          calories_target: number;
          protein_target: number;
          carbs_target: number;
          fat_target: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          calories_target?: number;
          protein_target?: number;
          carbs_target?: number;
          fat_target?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          calories_target?: number;
          protein_target?: number;
          carbs_target?: number;
          fat_target?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      nutrition_timeline_events: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          date: string;
          description: string | null;
          type: 'goal' | 'milestone' | 'checkpoint';
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          date: string;
          description?: string | null;
          type: 'goal' | 'milestone' | 'checkpoint';
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          date?: string;
          description?: string | null;
          type?: 'goal' | 'milestone' | 'checkpoint';
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
