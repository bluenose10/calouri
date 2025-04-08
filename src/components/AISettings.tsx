
import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Check } from 'lucide-react';

const AISettings: React.FC = () => {
  const [isVisible, setIsVisible] = useState<boolean>(false);
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm" 
        className="absolute top-4 right-4 z-10"
        onClick={() => setIsVisible(!isVisible)}
      >
        <Settings className="h-4 w-4 mr-2" />
        Food AI Settings
      </Button>
      
      {isVisible && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <h3 className="text-lg font-bold flex items-center justify-between">
                <span>Food AI Settings</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsVisible(false)}
                >
                  Close
                </Button>
              </h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">
                Food analysis is powered by OpenAI's vision capabilities. Our system uses advanced AI to analyze 
                food images and estimate nutritional content. The OpenAI API key is securely stored on the server.
              </p>
              
              <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-md">
                <p className="font-medium flex items-center"><Check className="h-4 w-4 mr-1" /> AI Analysis Ready</p>
                <p className="text-sm mt-1">
                  The system is configured with OpenAI API integration through Supabase Edge Functions. 
                  Your food images will be processed securely on the server.
                </p>
              </div>
              
              <Button 
                variant="default"
                onClick={() => {
                  setIsVisible(false);
                }}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AISettings;
