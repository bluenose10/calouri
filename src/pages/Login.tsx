
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '../context/AuthContext';
import { Apple } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoading: isAuthLoading, user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isMobile } = useIsMobile();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("Attempting to sign in with:", email);
      await signIn(email, password);
      console.log("Sign-in successful");
      
      // Force navigation to dashboard after successful login
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine if any loading state is active
  const isLoading = isAuthLoading || isSubmitting;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-3 md:p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-md border-0">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-health-primary flex items-center justify-center">
                  <Apple className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-800 ml-2">Calouri</h1>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-4">Sign in to your Calouri account</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-health-primary hover:bg-health-primary/90 h-10 mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 pt-0">
            <p className="text-xs text-gray-500">
              Don't have an account?{" "}
              <Link to="/signup" className="text-health-primary font-medium hover:underline">
                Sign up
              </Link>
            </p>
            <Link to="/" className="text-xs text-health-primary font-medium hover:underline">
              Home
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Login;
