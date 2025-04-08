
import React from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import HeroSection from '../components/home/HeroSection';
import AppInActionSection from '../components/home/AppInActionSection';
import WhyChooseSection from '../components/home/WhyChooseSection';
import BrandingSection from '../components/home/BrandingSection';
import GetStartedSection from '../components/home/GetStartedSection';
import { useCapacitor } from '../hooks/use-capacitor';

const Index: React.FC = () => {
  const { user } = useAuth();
  const { isCapacitor } = useCapacitor();
  
  // Redirect authenticated users to dashboard
  if (user) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <div className="min-h-screen bg-[#f5f7f9] flex flex-col">
      <Header />
      <main className="flex-grow">
        <HeroSection />
        <AppInActionSection />
        <WhyChooseSection />
        <BrandingSection />
        <GetStartedSection />
      </main>
      <Footer />
      
      {isCapacitor && (
        <div className="fixed bottom-0 left-0 right-0 bg-green-100 p-3 text-center text-sm">
          Running in native app mode
        </div>
      )}
    </div>
  );
};

export default Index;
