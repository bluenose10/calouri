
export interface AuthContextType {
  user: any;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => void;
  isLoading: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  quantity?: number;
  mealType?: string;
  notes?: string;
  timestamp?: string | Date;
  userId?: string;
  imageUrl?: string | null;
}

export interface FoodContextType {
  currentFood: FoodItem | null;
  setCurrentFood: (food: FoodItem | null) => void;
  updateCurrentFood: (updates: Partial<FoodItem>) => void;
  history: FoodItem[];
  addToHistory: (food: FoodItem) => Promise<void>;
  saveAnalysis: (food: FoodItem) => Promise<void>;
  deleteFromHistory: (id: string) => Promise<void>;
  loadUserHistory: () => Promise<void>;
  isLoading: boolean;
  retentionDays: number;
  analyticsData: {
    monthlyAverages: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    weeklyTrends: any[];
  };
}
