import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ChevronDown, ChevronUp, Info } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Privacy: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--app-background))]">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="h-6 w-6 text-health-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-health-primary">Privacy Policy</h1>
          </div>
          
          <div className="prose prose-sm md:prose-base max-w-none">
            <p className="text-gray-700 mb-6">
              At Calouri, we take your privacy seriously. This Privacy Policy describes how we collect, use, 
              and share your personal information when you use our website and mobile application.
            </p>
            
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="item-1" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">1. Information We Collect</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p className="font-medium mb-2">Personal Information</p>
                  <p>When you create an account, we collect your email address, name, and profile information.</p>
                  
                  <p className="font-medium mt-4 mb-2">Health and Nutrition Data</p>
                  <p>We collect information about your food consumption, dietary preferences, and health goals that you choose to enter into our service.</p>
                  
                  <p className="font-medium mt-4 mb-2">Usage Data</p>
                  <p>We automatically collect information about how you interact with our service, including access times, pages viewed, and the features you use.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">2. How We Use Your Information</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Provide, maintain, and improve our services</li>
                    <li>Process your transactions and manage your account</li>
                    <li>Send you service-related notifications and updates</li>
                    <li>Personalize your experience and provide tailored recommendations</li>
                    <li>Analyze usage patterns to improve our service</li>
                    <li>Protect against fraudulent or unauthorized activity</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">3. Sharing Your Information</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>We do not sell your personal information to third parties. We may share your information with:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Service providers who help us operate our business</li>
                    <li>Partners who provide complementary services (with your consent)</li>
                    <li>Legal authorities when required by law</li>
                  </ul>
                  <p className="mt-3">Any third-party service providers we use are contractually obligated to use your information only for the purposes of providing services to us and to maintain appropriate security measures.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">4. Data Security</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, accidental loss, and alteration.</p>
                  <p className="mt-2">While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security. You are responsible for maintaining the secrecy of your account credentials.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">5. Your Rights</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>Depending on your location, you may have the right to:</p>
                  <ul className="list-disc ml-5 mt-2 space-y-1">
                    <li>Access the personal information we hold about you</li>
                    <li>Correct inaccurate information</li>
                    <li>Delete your personal information</li>
                    <li>Restrict or object to certain processing of your data</li>
                    <li>Data portability (receiving your data in a structured format)</li>
                    <li>Withdraw consent where processing is based on consent</li>
                  </ul>
                  <p className="mt-3">To exercise these rights, please contact us using the information provided at the end of this policy.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-6" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">6. Cookies and Tracking Technologies</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>We use cookies and similar tracking technologies to track activity on our service and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
                  <p className="mt-2">We use both session cookies, which expire when you close your browser, and persistent cookies, which remain on your device until they expire or you delete them.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-7" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">7. Children's Privacy</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>Our service is not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13. If we discover that a child under 13 has provided us with personal information, we will promptly delete it.</p>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-8" className="border rounded-lg p-1">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="text-gray-800 font-medium">8. Changes to This Privacy Policy</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-1 text-gray-600">
                  <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "last updated" date.</p>
                  <p className="mt-2">You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="mt-10 p-5 bg-health-light rounded-lg border border-health-primary/20">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-health-primary mt-0.5" />
                <div>
                  <h3 className="text-health-dark font-semibold mb-2">Questions about your privacy?</h3>
                  <p className="text-gray-700">
                    If you have any questions or concerns about our Privacy Policy or data practices, please <Link to="/contact" className="text-health-primary hover:underline">contact us</Link>.
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

export default Privacy;
