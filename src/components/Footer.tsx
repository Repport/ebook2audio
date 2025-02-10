
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="mt-12 py-8 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <a 
              href="mailto:support@ebooktoaudio.com"
              className="hover:text-primary transition-colors"
            >
              support@ebooktoaudio.com
            </a>
          </div>
          <nav className="flex flex-wrap justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <Link 
              to="/privacy" 
              className="hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/cookie-policy" 
              className="hover:text-primary transition-colors"
            >
              Cookie Policy
            </Link>
          </nav>
        </div>
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500">
          © {new Date().getFullYear()} eBookToAudio. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
