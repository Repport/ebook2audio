
import { Link } from 'react-router-dom';
import { useLanguage } from "@/hooks/useLanguage";

const TermsContent = () => {
  const { translations } = useLanguage();
  
  return (
    <ol className="list-decimal list-inside space-y-2">
      <li className="text-sm">
        <span className="font-semibold">User Responsibility:</span> You declare and guarantee that you have the legal rights to use, process, and convert the content of the file you are uploading.
      </li>
      <li className="text-sm">
        <span className="font-semibold">Copyright Compliance:</span> Uploading copyrighted content without explicit authorization from the rights holder is strictly prohibited. The user is solely responsible for any infringement.
      </li>
      <li className="text-sm">
        <span className="font-semibold">{translations.liabilityDisclaimer}</span>
      </li>
      <li className="text-sm">
        <span className="font-semibold">Data Retention:</span> {translations.dataRetentionDesc}
      </li>
      <li className="text-sm">
        <span className="font-semibold">Privacy Policy:</span> Please refer to our <Link to="/privacy" className="text-blue-600 hover:underline" target="_blank">privacy policy</Link> for more details about data handling and retention.
      </li>
      <li className="text-sm">
        <span className="font-semibold">Terms of Use:</span> We reserve the right to suspend or terminate access to this service in case of misuse or violation of these terms.
      </li>
    </ol>
  );
};

export default TermsContent;
