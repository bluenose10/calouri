
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Apple, LogOut, AlertTriangle, Menu } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from '@/hooks/use-mobile';

const DashboardNavbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const supabaseConfigured = isSupabaseConfigured();
  const { isMobile } = useIsMobile();
  
  // Get user's name from metadata
  const firstName = user?.user_metadata?.first_name || '';
  const userName = firstName || user?.email?.split('@')[0] || 'User';

  const handleSignOut = () => {
    console.log("Sign out button clicked");
    try {
      // Call signOut from AuthContext
      signOut();
      toast.success("Signed out successfully");
      // Navigate home
      navigate('/');
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
      // Force navigation to home page even if there's an error
      navigate('/');
    }
  };

  return (
    <div className="bg-white shadow-sm">
      {!supabaseConfigured && (
        <Alert variant="destructive" className="rounded-none border-x-0 border-t-0">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.
          </AlertDescription>
        </Alert>
      )}
      <div className="container mx-auto px-3 py-2 md:px-4 md:py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-1 md:gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-green-600 flex items-center justify-center">
            <Apple className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800">Calouri</h1>
        </Link>
        
        {isMobile ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-health-primary text-white">
                      {firstName ? firstName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Welcome, {userName}!</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-red-500 focus:text-red-500 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-gray-700 mr-2">Welcome, {userName}!</span>
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-health-primary text-white">
                {firstName ? firstName.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-1"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardNavbar;
