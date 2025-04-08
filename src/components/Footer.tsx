
import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="py-4 md:py-6 bg-white border-t">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-0">
            © {year} Calouri. All rights reserved.
          </p>
          <div className="flex items-center space-x-6">
            <Link to="/contact" className="text-xs md:text-sm text-gray-500 hover:text-health-primary transition-colors">
              Contact Us
            </Link>
            <Link to="/terms" className="text-xs md:text-sm text-gray-500 hover:text-health-primary transition-colors">
              Terms of Service
            </Link>
            <Link to="/privacy" className="text-xs md:text-sm text-gray-500 hover:text-health-primary transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
