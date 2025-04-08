
import React from 'react';
import { Button } from '@/components/ui/button';
import { Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImageCapturePromptProps {
  isProcessing: boolean;
  onOpenCamera: () => void;
}

const ImageCapturePrompt: React.FC<ImageCapturePromptProps> = ({ 
  isProcessing, 
  onOpenCamera 
}) => {
  const { isMobile } = useIsMobile();
  
  // If on mobile, don't render the component at all
  if (isMobile) {
    return null;
  }
  
  return (
    <div className="border border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500 text-center mb-2">
        {isProcessing ? 'Processing...' : 'Capture your meal to analyze nutrition'}
      </p>
      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-3">
        <Camera size={20} className="text-gray-400" />
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        className="mt-2"
        onClick={onOpenCamera}
        disabled={isProcessing}
      >
        {isMobile ? 'Take Food Pic' : 'Take Photo'}
      </Button>
    </div>
  );
};

export default ImageCapturePrompt;
