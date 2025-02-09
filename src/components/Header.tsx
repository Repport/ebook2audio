
import React from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/hooks/useAuth';
import UserMenu from './UserMenu';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLanguage } from '@/hooks/useLanguage';
import LanguageSelector from './LanguageSelector';

const Header = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { translations } = useLanguage();

  return (
    <header role="banner" className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <div className="flex-1">
          <LanguageSelector />
        </div>
        <div className="flex items-center gap-2">
          {!user && (
            <>
              <Link to="/auth">
                <Button variant="ghost" size={isMobile ? "sm" : "default"}>
                  {translations.signIn}
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size={isMobile ? "sm" : "default"}>
                  {translations.signUp}
                </Button>
              </Link>
            </>
          )}
          <ThemeToggle />
          {user && <UserMenu user={user} />}
        </div>
      </div>
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {translations.title}
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          {translations.subtitle}
        </p>
        <nav className="mt-4" aria-label="Main features">
          <ul className="flex justify-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <li>{translations.featureChapterDetection}</li>
            <li>{translations.featureMultipleVoices}</li>
            <li>{translations.featureSupport}</li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
