export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
      <p className="mb-4">
        This website uses cookies to ensure the proper operation and security of the site. Cookies are small text files stored on your device by your browser. We use the following types of cookies:
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Essential Cookies</h2>
      <p className="mb-4">
        These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually set in response to actions made by you, such as logging in, setting your preferences, or filling in forms. Without these cookies, some parts of the site will not work properly.
      </p>
      <ul className="list-disc pl-6 mb-4">
        <li><strong>Session Cookies:</strong> Used to manage your login session and keep you authenticated as you navigate the site.</li>
        <li><strong>Preference Cookies:</strong> Used to remember your settings and preferences, such as articles per page or selected categories.</li>
        <li><strong>Security Cookies:</strong> Used to help detect and prevent security risks.</li>
      </ul>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Analytics and Third-Party Cookies</h2>
      <p className="mb-4">
        We do <strong>not</strong> use analytics or advertising cookies. No third-party cookies are set for tracking or marketing purposes.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Managing Cookies</h2>
      <p>
        You can control and manage cookies through your browser settings. Please note that disabling essential cookies may affect the functionality of the site.
      </p>
    </div>
  );
} 