
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePremiumAccess } from '@/hooks/use-premium-access';
import { useAuth } from '@/context/AuthContext';
import PremiumAccessBanner from './premium/PremiumAccessBanner';
import { Button } from './ui/button';

const PremiumProtectedRoute: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumAccess();
  const location = useLocation();
  
  console.log("PremiumProtectedRoute - isPremium:", isPremium);
  console.log("PremiumProtectedRoute - authLoading:", authLoading);
  console.log("PremiumProtectedRoute - premiumLoading:", premiumLoading);
  
  // Show loading state while checking auth and premium status
  if (authLoading || premiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <p className="text-xl text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log("PremiumProtectedRoute - No user, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If not premium, show upgrade banner and block access
  if (!isPremium) {
    console.log("PremiumProtectedRoute - Not premium, showing upgrade banner");
    return (
      <div className="min-h-screen bg-[hsl(var(--app-background))] p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Premium Feature</h1>
          <PremiumAccessBanner />
          <div className="mt-8 text-center">
            <p className="text-lg text-gray-600">
              Please upgrade to access this premium feature.
            </p>
            <Button 
              onClick={() => window.history.back()}
              className="mt-4 text-health-primary hover:underline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // If premium, allow access to the protected route
  console.log("PremiumProtectedRoute - Is premium, allowing access");
  return <Outlet />;
};

export default PremiumProtectedRoute;
