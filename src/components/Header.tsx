
import React from 'react';

const Header = () => {
  return (
    <header role="banner" className="text-center mb-12">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">
        eBook to MP3 Converter
      </h1>
      <p className="text-lg text-gray-600">
        Convert your EPUB and PDF books to MP3 audio files with advanced chapter detection
      </p>
      <nav className="mt-4" aria-label="Main features">
        <ul className="flex justify-center gap-4 text-sm text-gray-600">
          <li>✓ Chapter Detection</li>
          <li>✓ Multiple Voices</li>
          <li>✓ EPUB & PDF Support</li>
        </ul>
      </nav>
    </header>
  );
};

export default Header;
