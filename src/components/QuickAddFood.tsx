
import React, { useRef, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon, Upload, ServerIcon } from 'lucide-react';
import { useFoodContext } from '../context/FoodContext';
import { analyzeImage } from '../services/aiService';
import { compressImage } from '../utils/imageUtils';
import { useAuth } from '../context/AuthContext';
import LoginPrompt from './LoginPrompt';
import MealTypeSelector from './MealTypeSelector';
import ImageCapturePrompt from './ImageCapturePrompt';
import Camera from './Camera';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import AnalysisProgressBar from './AnalysisProgressBar';

const QuickAddFood: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setCurrentFood } = useFoodContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState<string>("");
  const { user } = useAuth();
  const [mealType, setMealType] = useState<string>('lunch');
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const { toast } = useToast();
  const { isMobile } = useIsMobile();
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!user) {
    return <LoginPrompt />;
  }

  useEffect(() => {
    const handleAnalysisTimeout = () => {
      console.log("Analysis timeout event received");
      
      if (isProcessing) {
        toast({
          title: "Analysis timeout",
          description: "The food analysis is taking too long. Please try again with a smaller image or better connection.",
          variant: "destructive"
        });
        
        clearProcessingTimer();
        setIsProcessing(false);
        setProcessingProgress(0);
      }
    };
    
    window.addEventListener('analysis-timeout', handleAnalysisTimeout);
    
    return () => {
      window.removeEventListener('analysis-timeout', handleAnalysisTimeout);
    };
  }, [isProcessing, toast]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large", 
        description: "Please select an image under 10MB",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProcessingStage("Preparing image");
    setProcessingProgress(10);
    
    setupProcessingAnimation();
    
    if (isMobile) {
      analysisTimeoutRef.current = setTimeout(() => {
        if (isProcessing) {
          console.log("Global timeout triggered for mobile upload");
          toast({
            title: "Upload timeout",
            description: "Your food analysis timed out. Please try again with a smaller image or better connection.",
            variant: "destructive"
          });
          clearProcessingTimer();
          setIsProcessing(false);
        }
      }, 45000); // 45 second timeout for mobile uploads
    }
    
    try {
      console.log(`Processing image: ${file.name}, type: ${file.type}, size: ${file.size / 1024} KB`);
      
      setProcessingStage("Compressing image");
      setProcessingProgress(25);
      const compressedImage = await compressImage(file);
      console.log('Image compressed successfully');
      
      if (isMobile) {
        console.log('Mobile upload detected, checking image quality before processing');
        if (compressedImage.length < 10000) {
          toast({
            title: "Low quality image",
            description: "The image quality is too low. Please try again with a clearer photo.",
            variant: "destructive"
          });
          setIsProcessing(false);
          clearProcessingTimer();
          return;
        }
      }
      
      processImage(compressedImage);
    } catch (error) {
      console.error("Error processing image:", error);
      
      if (error instanceof Error && error.message.includes('HEIC')) {
        toast({
          title: "HEIC Image Format",
          description: "We couldn't convert your HEIC image. Please convert it to JPEG or PNG first, or try taking a photo directly with our camera.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process the image: " + (error instanceof Error ? error.message : "Unknown error"),
          variant: "destructive"
        });
      }
      setIsProcessing(false);
      clearProcessingTimer();
      clearAnalysisTimeout();
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const clearProcessingTimer = () => {
    if (processingTimerRef.current) {
      clearInterval(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  };
  
  const clearAnalysisTimeout = () => {
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = null;
    }
  };

  const setupProcessingAnimation = () => {
    clearProcessingTimer();
    let lastProgress = 10;
    processingTimerRef.current = setInterval(() => {
      setProcessingProgress(prev => {
        const remaining = 95 - prev;
        if (remaining <= 0) return prev;
        const increment = Math.max(0.5, remaining * 0.05);
        return Math.min(95, prev + increment);
      });
    }, 800);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const openCamera = () => {
    setShowCamera(true);
    
    if (isMobile) {
      toast({
        description: "Getting ready to capture food photo",
      });
      
      // Check if this is a mobile browser that supports camera API
      if ('mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices) {
        console.log("Mobile device with camera API support detected");
      } else {
        console.log("Mobile device without camera API support detected");
        toast({
          description: "Your browser may not fully support camera access. You can also use the upload option."
        });
      }
    } else {
      toast({
        description: "Opening camera for food photo capture"
      });
    }
  };

  const processImage = async (imageUrl: string) => {
    setIsProcessing(true);
    setProcessingStage("Analyzing food image");
    setProcessingProgress(40);
    
    try {
      toast({
        title: "Analyzing food",
        description: "Please wait while we analyze your meal...",
      });
      
      const deviceType = isMobile ? "Mobile" : "Desktop";
      console.log(`Processing image on ${deviceType} device`);
      
      setProcessingProgress(60);
      
      const foodData = await analyzeImage(imageUrl, user.id);
      
      if (!foodData || !foodData.name) {
        throw new Error("Could not identify the food in this image. Please try a clearer photo.");
      }
      
      setProcessingProgress(100);
      
      setCurrentFood({
        ...foodData,
        mealType
      });
      
      toast({
        title: "Food analyzed",
        description: `Your ${foodData.name} has been successfully analyzed`,
      });
    } catch (error) {
      console.error("Error analyzing food:", error);
      
      toast({
        title: "Analysis failed",
        description: error instanceof Error 
          ? `Could not analyze the food image: ${error.message}` 
          : "Could not analyze the food image. Please try again with a different image.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      clearProcessingTimer();
      clearAnalysisTimeout();
    }
  };

  const handleCameraCapture = (imageUrl: string) => {
    setShowCamera(false);
    processImage(imageUrl);
  };

  const handleCameraClose = () => {
    setShowCamera(false);
  };

  if (showCamera) {
    return (
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center justify-between">
            <span>Take a Food Photo</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleCameraClose}
            >
              Cancel
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Camera 
            onCapture={handleCameraCapture}
            initialMealType={mealType}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <AnalysisProgressBar 
        isVisible={isProcessing} 
        progress={processingProgress} 
        stage={processingStage} 
      />
      
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <span>Capture Food</span>
            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full flex items-center">
              <ServerIcon className="h-3 w-3 mr-1" />
              AI Analysis
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MealTypeSelector value={mealType} onChange={setMealType} />
            
            {/* Hide Take Food Photo button on mobile */}
            {!isMobile && (
              <Button 
                className="w-full justify-start gap-2 bg-health-primary hover:bg-health-primary/90 text-white"
                onClick={openCamera}
                disabled={isProcessing}
              >
                <CameraIcon size={16} />
                Take Food Photo
              </Button>
            )}
            
            <Button 
              variant="default" 
              className="w-full justify-start gap-2 bg-health-primary hover:bg-health-primary/90 text-white"
              onClick={triggerFileInput}
              disabled={isProcessing}
            >
              <Upload size={16} />
              {isMobile ? "Take Food Pic" : "Upload Food Image"}
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            
            {/* Only show ImageCapturePrompt on desktop - the component itself also has a mobile check */}
            {!isMobile && (
              <ImageCapturePrompt 
                isProcessing={isProcessing} 
                onOpenCamera={openCamera} 
              />
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default QuickAddFood;
