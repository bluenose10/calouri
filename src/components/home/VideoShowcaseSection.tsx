
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

const VideoShowcaseSection: React.FC = () => {
  const [videoPlaying, setVideoPlaying] = useState(false);
  // Vimeo video ID
  const vimeoVideoId = "1072980250";
  
  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto">
        <div className="max-w-4xl mx-auto px-4 md:px-0">
          <div className="relative rounded-xl overflow-hidden shadow-xl">
            {!videoPlaying ? (
              <div className="relative">
                <img 
                  src="/lovable-uploads/2664fbf6-9a27-4695-9ac3-7b27e54e8f70.png" 
                  alt="Calorie Calculator App Thumbnail" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button 
                    onClick={() => setVideoPlaying(true)} 
                    className="bg-health-primary hover:bg-health-primary/90 rounded-full w-16 h-16 flex items-center justify-center"
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ padding: '56.25% 0 0 0', position: 'relative' }}>
                <iframe 
                  src={`https://player.vimeo.com/video/${vimeoVideoId}?h=9d7c9699c5&autoplay=1&title=0&byline=0&portrait=0`} 
                  className="absolute top-0 left-0 w-full h-full"
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowFullScreen
                  title="Calorie Calculator Demo"
                ></iframe>
              </div>
            )}
          </div>
          <p className="text-gray-600 text-center mt-4 max-w-2xl mx-auto">
            Join today for more inspirational help with your health journey. Our community and tools will keep you motivated and on track to reach your goals.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VideoShowcaseSection;
