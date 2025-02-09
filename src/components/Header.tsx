
import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';

const Header = () => {
  const { user } = useAuth();

  return (
    <header role="banner" className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          {!user && (
            <Link to="/auth">
              <Button variant="outline" size="sm">
                Sign in
              </Button>
            </Link>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          {user && <UserMenu user={user} />}
        </div>
      </div>
      <div className="text-center">
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
      </div>
    </header>
  );
};

export default Header;
