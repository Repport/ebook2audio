import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

const CookiePolicy = () => {
  const { translations } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <Link to="/">
            <Button variant="outline" size="sm">
              {translations.backToConverter}
            </Button>
          </Link>
          
          <h1 className="text-4xl font-bold">{translations.cookiePolicy}</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Introduction</h2>
              <p>
                This Cookie Policy explains how we use cookies and similar tracking technologies on our website.
                By using our website, you consent to the use of cookies as described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">What Are Cookies?</h2>
              <p>
                Cookies are small text files that are placed on your device when you visit a website.
                They help us provide you with a better experience by enabling basic functions like page
                navigation, secure access to restricted areas, and remembering your preferences.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">1. Necessary Cookies</h3>
              <p>
                These cookies are essential for the proper functioning of our website. They enable core
                functionality such as security, network management, and accessibility. You may disable
                these by changing your browser settings, but this will affect how the website functions.
              </p>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">2. Analytics Cookies</h3>
              <p>
                We use analytics cookies to understand how visitors interact with our website. These cookies
                help us measure the number of visitors, see which pages are the most popular, and understand
                how visitors move around the site. All information these cookies collect is aggregated and
                therefore anonymous.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Understanding which pages are most frequently visited</li>
                <li>Analyzing how users navigate through our website</li>
                <li>Measuring the effectiveness of our service improvements</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-6 mb-3">3. Advertising Cookies</h3>
              <p>
                These cookies are used to make advertising messages more relevant to you. They perform
                functions like preventing the same ad from continuously reappearing, ensuring that ads
                are properly displayed, and selecting advertisements that are based on your interests.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-2">
                <li>Delivering personalized advertisements</li>
                <li>Measuring the performance of our advertising campaigns</li>
                <li>Preventing repetitive advertisements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Managing Cookie Preferences</h2>
              <p>
                You can manage your cookie preferences at any time through our cookie consent banner.
                Additionally, most web browsers allow you to control cookies through their settings.
                Please note that if you disable certain cookies, some features of our website may not
                function properly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Third-Party Cookies</h2>
              <p>
                Some cookies are placed by third-party services that appear on our pages. We use these
                services to enhance our website's functionality and analyze usage patterns. These third
                parties may use cookies to track your online activities and across different websites.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Updates to This Policy</h2>
              <p>
                We may update this Cookie Policy from time to time to reflect changes in our practices
                or for operational, legal, or regulatory reasons. We encourage you to periodically
                review this page for the latest information on our cookie practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
              <p>
                If you have any questions about our use of cookies or this Cookie Policy, please contact us.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicy;
