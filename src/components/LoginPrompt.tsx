
import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LoginPrompt: React.FC = () => {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Track Your Food</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-500 text-sm">
            Sign in to access food tracking features and save your nutrition data.
          </p>
          <Button 
            className="w-full bg-health-primary hover:bg-health-primary/90"
            asChild
          >
            <Link to="/login">Sign In</Link>
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            asChild
          >
            <Link to="/signup">Create Account</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LoginPrompt;
