'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ContactContent() {
  const searchParams = useSearchParams();
  const success = searchParams?.get('success');

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 dark:text-white text-center">Contact Us</h1>
      {success && (
        <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded mb-4">
          Your message has been sent successfully!
        </div>
      )}
      <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <form
          name="contact"
          method="POST"
          action={process.env.NEXT_PUBLIC_CONTACT_FORM_ACTION}
          className="space-y-6"
        >
          <div>
            <label htmlFor="last-name" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Last name</label>
            <input
              type="text"
              name="last-name"
              id="last-name"
              className="block w-full p-2.5 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Doe"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your email</label>
            <input
              type="email"
              name="email"
              id="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="jdoe@myemail.com"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Your message</label>
            <textarea
              name="message"
              id="message"
              rows={6}
              className="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder=""
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="terms"
              required
              className="w-4 h-4 bg-gray-100 border-gray-300 rounded-sm text-primary-600 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="terms" className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
              You confirm that you have read and agree to our
              <a href="/privacy" title="Privacy Policy" className="font-medium text-gray-900 underline hover:no-underline dark:text-white"> Privacy Policy </a>.
            </label>
          </div>
          <button
            type="submit"
            className="w-full px-5 py-3 text-sm font-medium text-center text-white rounded-lg bg-primary-500 hover:bg-primary-800 focus:ring-4 focus:outline-none focus:ring-primary-300 dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            Send message
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactContent />
    </Suspense>
  );
} 