'use client';

import { Button } from 'flowbite-react';
import Link from 'next/link';

export default function Error() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-red-600">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-gray-600">
            There was a problem signing you in. Please try again.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <Link href="/auth/signin">
            <Button className="w-full">
              Back to Sign In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 