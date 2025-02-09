
import React from 'react';
import { ThemeToggle } from './ThemeToggle';

const Header = () => {
  return (
    <header role="banner" className="text-center mb-12">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        eBook to MP3 Converter
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        Convert your EPUB and PDF books to MP3 audio files with advanced chapter detection
      </p>
      <nav className="mt-4" aria-label="Main features">
        <ul className="flex justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <li>✓ Chapter Detection</li>
          <li>✓ Multiple Voices</li>
          <li>✓ EPUB & PDF Support</li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
