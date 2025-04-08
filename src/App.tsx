
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Contact from "./pages/Contact";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { FoodProvider } from "./context/FoodContext";
import NutriChatPage from "./pages/NutriChatPage";
import FoodInsightsPage from "./pages/FoodInsightsPage";
import HealthTrackerPage from "./pages/HealthTrackerPage";
import PremiumProtectedRoute from "./components/PremiumProtectedRoute";
import { useCapacitor } from "./hooks/use-capacitor";

const queryClient = new QueryClient();

// Layout component to handle shared elements across all pages
const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const { isCapacitor } = useCapacitor();
  
  useEffect(() => {
    // Ensure body can scroll
    document.documentElement.style.overflowY = 'auto';
    document.body.style.overflowY = 'auto';
    
    // Add padding for mobile devices (iOS safe areas)
    if (isCapacitor) {
      document.body.classList.add('capacitor-app');
      // Add iOS safe area padding
      const style = document.createElement('style');
      style.innerHTML = `
        body.capacitor-app {
          padding-top: env(safe-area-inset-top, 0px);
          padding-bottom: env(safe-area-inset-bottom, 0px);
          padding-left: env(safe-area-inset-left, 0px);
          padding-right: env(safe-area-inset-right, 0px);
        }
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      document.documentElement.style.overflowY = '';
      document.body.style.overflowY = '';
    };
  }, [isCapacitor]);
  
  return (
    <>
      {children}
    </>
  );
};

// Protected and public routes need to be inside AuthProvider context
const AppRoutes = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  // Debug routing
  useEffect(() => {
    console.log("Current route:", location.pathname);
    console.log("User authenticated:", !!user);
    
    // Force redirect to login if on dashboard without auth
    if (location.pathname === "/dashboard" && !user && !isLoading) {
      console.log("Unauthorized access to dashboard, redirecting to login");
    }
  }, [location.pathname, user, isLoading]);
  
  // Show loading indicator while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        
        {/* Protected route - redirects to login if not authenticated */}
        <Route 
          path="/dashboard" 
          element={
            user ? 
              <Dashboard /> : 
              <Navigate to="/login" replace state={{ from: location }} />
          } 
        />
        
        {/* Premium protected routes - redirects to login if not authenticated */}
        {/* and shows upgrade banner if not premium */}
        <Route element={<PremiumProtectedRoute />}>
          <Route path="/nutrichat" element={<NutriChatPage />} />
          <Route path="/foodinsights" element={<FoodInsightsPage />} />
          <Route path="/healthtracker" element={<HealthTrackerPage />} />
        </Route>
        
        {/* Public routes - redirect to dashboard if already authenticated */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <Signup />} 
        />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
};

const App = () => {
  console.log("App rendering");
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AuthProvider>
          <FoodProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </FoodProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
