
import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { useIsMobile } from '@/hooks/use-mobile';

interface AnalysisProgressBarProps {
  isVisible: boolean;
  progress?: number;
  stage?: string;
}

const AnalysisProgressBar: React.FC<AnalysisProgressBarProps> = ({ 
  isVisible, 
  progress = 75, 
  stage = "Analyzing your food"
}) => {
  const { isMobile } = useIsMobile();
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showExtendedMessage, setShowExtendedMessage] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [forceProgressTo100, setForceProgressTo100] = useState(false);
  const [showApiTroubleshooting, setShowApiTroubleshooting] = useState(false);
  
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isVisible) {
      // Reset elapsed time when analysis starts
      setTimeElapsed(0);
      setShowExtendedMessage(false);
      setShowTimeoutWarning(false);
      setForceProgressTo100(false);
      setShowApiTroubleshooting(false);
      
      // Create timer to count elapsed time and show extended message after 15 seconds
      timer = setInterval(() => {
        setTimeElapsed(prev => {
          const newValue = prev + 1;
          
          // Show extended message if taking too long (10+ seconds on mobile, 15+ on desktop)
          const extendedMsgThreshold = isMobile ? 10 : 15;
          if (newValue > extendedMsgThreshold && !showExtendedMessage) {
            setShowExtendedMessage(true);
          }
          
          // Show timeout warning after 20 seconds on mobile, 25 on desktop (reduced thresholds)
          const timeoutWarningThreshold = isMobile ? 20 : 25;
          if (newValue > timeoutWarningThreshold && !showTimeoutWarning) {
            setShowTimeoutWarning(true);
          }
          
          // Show API troubleshooting info after 30 seconds
          const apiTroubleshootingThreshold = 30;
          if (newValue > apiTroubleshootingThreshold && !showApiTroubleshooting) {
            setShowApiTroubleshooting(true);
          }
          
          // Force progress to 100% after 100 seconds on mobile or desktop (increased from 90)
          if (newValue > 100 && progress < 100 && !forceProgressTo100) {
            console.log("Forcing progress to 100% after timeout");
            setForceProgressTo100(true);
            window.dispatchEvent(new CustomEvent('analysis-timeout'));
          }
          
          return newValue;
        });
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isVisible, progress, isMobile, showExtendedMessage, showTimeoutWarning, forceProgressTo100, showApiTroubleshooting]);

  // Listen for mobile-analysis-progress events
  useEffect(() => {
    const handleMobileProgress = (event: CustomEvent) => {
      if (event.detail?.progress) {
        setForceProgressTo100(false); // Reset force flag as we have a real update
      }
    };
    
    window.addEventListener('mobile-analysis-progress', 
      handleMobileProgress as EventListener);
    
    return () => {
      window.removeEventListener('mobile-analysis-progress', 
        handleMobileProgress as EventListener);
    };
  }, []);
  
  if (!isVisible) return null;

  // Calculate the final progress value based on all factors
  const displayProgress = forceProgressTo100 ? 100 : progress;

  // Mobile-specific messaging
  const getTimeoutMessage = () => {
    if (isMobile) {
      if (timeElapsed > 60) {
        return "Analysis is taking much longer than expected. Try using WiFi instead of cellular data, or try a clearer photo.";
      }
      return "Analysis is taking longer than usual on your mobile device. Please be patient.";
    }
    return "Analysis is taking longer than usual due to server connectivity. Still working...";
  };

  return (
    <div className="fixed top-16 left-0 right-0 z-50 bg-white shadow-md border-b border-green-100">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-3 mb-2 sm:mb-0">
            <div className="animate-pulse">
              <svg 
                className="w-5 h-5 text-health-primary" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-gray-800">{stage}...</span>
              <p className="text-xs text-gray-500 mt-0.5">
                {isMobile 
                  ? "Mobile analysis in progress - please be patient" 
                  : "This may take up to 45 seconds"}
              </p>
              {showExtendedMessage && (
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  {getTimeoutMessage()}
                </p>
              )}
              {showTimeoutWarning && (
                <p className="text-xs text-red-600 mt-1 font-medium">
                  {isMobile 
                    ? "Try using the camera directly instead of uploading a photo. Make sure you have good lighting."
                    : "Analysis is taking longer than expected. Please try again later."}
                </p>
              )}
              {showApiTroubleshooting && (
                <p className="text-xs text-blue-600 mt-1">
                  Our analysis service might be experiencing high demand.
                </p>
              )}
              {forceProgressTo100 && (
                <p className="text-xs text-blue-600 mt-1 font-medium animate-pulse">
                  Almost done! Finalizing analysis results...
                </p>
              )}
            </div>
          </div>
          <div className="w-full sm:w-1/3">
            <Progress className="h-2" value={displayProgress} indicatorClassName="bg-health-primary" />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">{timeElapsed}s</span>
              <span className="text-xs text-gray-500">{Math.round(displayProgress)}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgressBar;
