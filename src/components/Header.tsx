
import React from 'react';
import { Link } from 'react-router-dom';
import { Apple } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from "@/components/ui/button";

const Header: React.FC = () => {
  const { isMobile } = useIsMobile();
  
  return (
    <header className="bg-white py-4">
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center">
            <Apple className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">Calouri</h1>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-gray-700 hover:text-health-primary">
            Sign In
          </Link>
          <Button asChild className="bg-health-primary hover:bg-health-primary/90">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
