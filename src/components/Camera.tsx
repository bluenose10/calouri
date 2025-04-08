
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera as CameraIcon, X } from 'lucide-react';
import { compressImage, checkCameraPermissions } from '../utils/imageUtils';
import MealTypeSelector from './MealTypeSelector';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface CameraProps {
  onCapture: (imageUrl: string) => void;
  initialMealType?: string;
}

const Camera: React.FC<CameraProps> = ({ 
  onCapture, 
  initialMealType = 'lunch' 
}) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mealType, setMealType] = useState<string>(initialMealType);
  const [error, setError] = useState<string>('');
  const [showPermissionError, setShowPermissionError] = useState(false);
  const { toast } = useToast();
  const { isMobile } = useIsMobile();

  useEffect(() => {
    startCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const startCamera = async () => {
    setError('');
    setIsProcessing(true);
    setShowPermissionError(false);
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      console.log('Requesting camera access for photo capture...');
      
      const hasPermissions = await checkCameraPermissions();
      
      if (!hasPermissions) {
        console.warn('Camera permissions appear to be denied');
        
        // For mobile devices, don't show permission errors - just switch to file upload mode
        if (isMobile) {
          toast({
            description: "Please use the 'Upload Photo' option instead."
          });
          setIsProcessing(false);
          return;
        }
        
        // Only show permission error on desktop
        setShowPermissionError(true);
        setError('Camera access is blocked. Please check your browser settings to allow camera access.');
        setIsProcessing(false);
        return;
      }
      
      // Optimize camera settings for mobile
      const videoConstraints = isMobile ? 
        { 
          facingMode: { exact: 'environment' },  // Force back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 } 
        } :
        { 
          facingMode: { ideal: 'environment' }, // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        };
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('Setting up camera preview...');
        
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Important for iOS
        videoRef.current.setAttribute('autoplay', 'true');
        videoRef.current.muted = true;
        
        await videoRef.current.play();
        console.log('Camera preview started successfully');
        setIsCapturing(true);
        setIsProcessing(false);
        toast({
          description: "Camera ready for photo capture"
        });
      } else {
        console.error("Camera preview element not available");
        setError("Could not access camera. Please try again.");
        setIsProcessing(false);
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      
      let errorMessage = '';
      
      // For mobile devices, we won't show permission errors
      if (isMobile) {
        console.log('Mobile device detected, hiding camera error messages');
        toast({
          description: "Please use the 'Upload Photo' option instead."
        });
        setIsProcessing(false);
        return;
      }
      
      // Only show full error details on desktop
      errorMessage = 'Camera error: ';
      
      if (err.name === 'NotAllowedError') {
        errorMessage += 'Permission denied. Please allow camera access and try again.';
        setShowPermissionError(true);
      } else if (err.name === 'NotFoundError') {
        errorMessage += 'No camera found on your device.';
      } else if (err.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application.';
      } else if (err.name === 'OverconstrainedError') {
        errorMessage += 'Could not find a suitable camera. Try again with different constraints.';
      } else {
        errorMessage += err.message || 'Unknown error';
      }
      
      setError(errorMessage);
      
      // Only show toast on desktop
      if (!isMobile) {
        toast({
          title: "Camera Error",
          description: errorMessage,
          variant: "destructive"
        });
      }
      
      setIsProcessing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      console.log("Stopping camera...");
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCapturing(false);
    toast({
      description: "Camera has been turned off"
    });
  };

  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsProcessing(true);
    toast({
      description: "Capturing your photo..."
    });
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not get canvas context');
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageUrl = canvas.toDataURL('image/jpeg', 0.8);
      
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const compressedImage = await compressImage(file);
      
      if (compressedImage.length < 20000) {
        setError('The captured image is too small or blurry. Please try again with better lighting or a clearer shot.');
        setIsProcessing(false);
        return;
      }
      
      onCapture(compressedImage);
      stopCamera();
      
      toast({
        description: "Photo captured successfully"
      });
    } catch (error) {
      console.error("Error capturing photo:", error);
      setError('Failed to capture photo');
      toast({
        title: "Error",
        description: "Failed to capture photo",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    toast({
      description: "Processing your image..."
    });
    
    try {
      const compressedImage = await compressImage(file);
      onCapture(compressedImage);
      toast({
        description: "Image processed successfully"
      });
    } catch (error) {
      console.error("Error processing image:", error);
      setError('Failed to process image');
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const showPermissionGuide = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let guideText = '';
    
    if (isIOS) {
      guideText = "On iOS: Go to Settings > Safari > Camera, and set to 'Allow'.";
    } else if (isAndroid) {
      guideText = "On Android: Go to Settings > Site Settings > Camera, and allow camera access for this site.";
    } else {
      guideText = "Click the camera icon in the address bar and allow camera access, then refresh the page.";
    }
    
    toast({
      title: "How to Enable Camera",
      description: guideText,
      duration: 6000,
    });
  };

  return (
    <div className="relative flex flex-col items-center w-full">
      <MealTypeSelector value={mealType} onChange={setMealType} className="w-full mb-4" />

      {/* Only show errors on desktop */}
      {error && !isMobile && (
        <div className="w-full mb-4 p-3 bg-red-50 border border-red-300 rounded-md text-red-700 text-sm">
          {error}
          {showPermissionError && !isMobile && (
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-sm" 
                onClick={showPermissionGuide}
              >
                How to enable camera access
              </Button>
            </div>
          )}
        </div>
      )}

      {!isCapturing ? (
        <div className="w-full flex flex-col items-center justify-center p-6 bg-health-light rounded-lg">
          <div className="mb-6 text-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="currentColor" 
              className="w-16 h-16 mx-auto mb-4 text-health-primary"
            >
              <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
              <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3H4.5a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xl font-medium text-gray-800">Starting Camera...</h3>
            <p className="text-gray-600 mt-2">
              {isProcessing ? 'Accessing camera...' : 'Please allow camera access when prompted'}
            </p>
          </div>
          
          {isProcessing && (
            <div className="flex justify-center my-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-health-primary"></div>
            </div>
          )}
          
          <div className="w-full flex gap-2 mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={startCamera}
              disabled={isProcessing}
            >
              <CameraIcon className="h-4 w-4 mr-2" />
              Retry Camera
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={triggerFileInput}
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Photo
            </Button>
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
            capture="environment"
          />
        </div>
      ) : (
        <div className="relative w-full">
          <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
            <video 
              ref={videoRef} 
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              variant="destructive"
              className="w-12 h-12 rounded-full flex items-center justify-center"
              onClick={stopCamera}
            >
              <X size={24} />
            </Button>
            
            <Button
              onClick={captureImage}
              disabled={isProcessing}
              className="w-16 h-16 rounded-full bg-white border-4 border-health-primary flex items-center justify-center hover:bg-gray-100"
            >
              <div className="w-10 h-10 rounded-full bg-health-primary"></div>
            </Button>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Camera;
