import React from 'react';
import Script from 'next/script';

const ENABLE = process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLE === 'true';
const DOMAIN = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
const URL = process.env.NEXT_PUBLIC_PLAUSIBLE_URL;

export default function PlausibleScript() {
  if (!ENABLE || !DOMAIN || !URL) return null;
  return (
    <>
      <Script
        defer
        data-domain={DOMAIN}
        src={`${URL}/js/script.file-downloads.hash.outbound-links.js`}
      />
      <Script id="plausible-init">
        {`window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }`}
      </Script>
    </>
  );
} 