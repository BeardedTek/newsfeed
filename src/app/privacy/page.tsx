'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PrivacyContent() {
  const searchParams = useSearchParams();
  const section = searchParams.get('section');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose max-w-none">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        
        <h2 className="text-xl font-semibold mt-6 mb-4">1. Information We Collect</h2>
        <p>We collect information that you provide directly to us, including:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Account information (name, email address)</li>
          <li>User preferences and settings</li>
          <li>Reading history and interactions</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-4">2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Provide and maintain our services</li>
          <li>Personalize your experience</li>
          <li>Communicate with you about updates and changes</li>
          <li>Improve our services</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-4">3. Analytics and Tracking</h2>
        <p>
          We use <a href="https://plausible.io/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Plausible Analytics</a> to help us understand how visitors use our site. Plausible is a privacy-focused analytics tool that does not use cookies and does not collect any personal or identifiable information. All analytics data is aggregated and anonymized. We use this information solely to improve the user experience and monitor site performance.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-4">4. Data Security</h2>
        <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure.</p>

        <h2 className="text-xl font-semibold mt-6 mb-4">5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc pl-6 mb-4">
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of communications</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-4">6. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy, please contact us at:</p>
        <p className="mt-2">
          <a href="mailto:privacy@beardedtek.com" className="text-blue-600 hover:underline">
            privacy@beardedtek.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PrivacyContent />
    </Suspense>
  );
} 