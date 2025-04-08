import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Terms: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--app-background))]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="h-6 w-6 text-health-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-health-primary">Terms of Service</h1>
          </div>
          
          <div className="prose prose-sm md:prose-base max-w-none">
            <p className="text-gray-700 mb-6">
              Welcome to Calouri! These Terms of Service govern your use of our website and mobile application. 
              By accessing or using our service, you agree to be bound by these Terms. Please read them carefully.
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">1. Acceptance of Terms</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  By accessing or using the Calouri service, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this service.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">2. Use of Service</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>Calouri provides tools for tracking nutrition and calorie intake. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
                  <p className="mt-2">You agree not to use our service for any illegal or unauthorized purpose. You must not transmit any worms, viruses, or any code of a destructive nature.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">3. Content and User Data</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>You retain all rights to any content you submit, post or display on or through our service. By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute that content in connection with the service.</p>
                  <p className="mt-2">We respect your privacy regarding any information we may collect. Please refer to our Privacy Policy for more information.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">4. Subscriptions and Payments</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>Some features of our service require a subscription. By purchasing a subscription, you agree to pay the applicable fees.</p>
                  <p className="mt-2">Subscriptions are automatically renewed unless canceled before the end of the current period. You can cancel your subscription at any time from your account settings.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">5. Limitation of Liability</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>Calouri and its suppliers shall not be liable for any damages arising from the use of our service. This includes direct, indirect, incidental, punitive, and consequential damages.</p>
                  <p className="mt-2">The information provided by our service is for general information purposes only and is not intended as medical advice. Always consult with a healthcare professional before making significant changes to your diet or exercise routine.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">6. Modifications</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>We reserve the right to modify or replace these Terms at any time. We will provide notice of any significant changes by posting the new Terms on this page and updating the "last updated" date.</p>
                  <p className="mt-2">Your continued use of the service after changes are made constitutes your acceptance of the new Terms.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-7" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">7. Governing Law</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which our company is registered, without regard to its conflict of law provisions.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-10 p-5 bg-health-light rounded-lg border border-health-primary/20">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-health-primary mt-0.5" />
                <div>
                  <h3 className="text-health-dark font-semibold mb-2">Questions about our Terms?</h3>
                  <p className="text-gray-700">
                    If you have any questions about these Terms of Service, please <Link to="/contact" className="text-health-primary hover:underline">contact us</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
