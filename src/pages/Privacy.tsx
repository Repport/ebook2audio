import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';

const Privacy = () => {
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
          
          <h1 className="text-4xl font-bold">{translations.privacyPolicy}</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">1. Data Collection and Usage</h2>
              <p>When you use our service to convert documents to audio:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>We process your uploaded files solely for the purpose of conversion to audio format.</li>
                <li>Files are temporarily stored during the conversion process only.</li>
                <li>We do not permanently store your uploaded files or the generated audio files.</li>
                <li>All files are automatically deleted after the conversion process is complete.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">2. Cookie Usage</h2>
              <p>We use different types of cookies on our website. For detailed information about the cookies we use and how to manage them, please read our{" "}
                <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
              </p>
              <p>In summary, we use:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Necessary Cookies:</strong> Essential cookies that enable basic functionality and security features of the website.</li>
                <li><strong>Analytical Cookies:</strong> Help us understand how visitors interact with our website by collecting and reporting information anonymously. We use this data to improve our services.</li>
                <li><strong>Advertising Cookies:</strong> Used to deliver advertisements more relevant to you and your interests. They are also used to limit the number of times you see an advertisement and help measure the effectiveness of advertising campaigns.</li>
              </ul>
              <p className="mt-4">You can manage your cookie preferences at any time through our cookie consent banner or by visiting our Cookie Policy page.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">3. Data Retention</h2>
              <p>Your files are retained only for the duration necessary to complete the conversion process. Once you download your converted audio file, both the original and converted files are permanently deleted from our servers.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">4. Security Measures</h2>
              <p>We implement appropriate security measures to protect your files during the conversion process:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Secure file transfer using encryption</li>
                <li>Temporary storage with restricted access</li>
                <li>Automatic file deletion after conversion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">5. Analytics and Advertising</h2>
              <p>We use analytics tools and advertising services to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Understand how our website is being used</li>
                <li>Improve our services based on user behavior</li>
                <li>Deliver relevant advertisements</li>
                <li>Measure the effectiveness of our advertising campaigns</li>
              </ul>
              <p className="mt-4">You can opt-out of analytical and advertising cookies while still using the essential features of our website.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights</h2>
              <p>As a user of our service, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Know how your data is being processed</li>
                <li>Request immediate deletion of your files</li>
                <li>Object to the processing of your data</li>
                <li>Manage your cookie preferences</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">7. Updates to Privacy Policy</h2>
              <p>We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mt-8 mb-4">8. Contact Information</h2>
              <p>If you have any questions about this privacy policy or our data practices, please contact us.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
