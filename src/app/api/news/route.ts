import { NextRequest, NextResponse } from 'next/server';

const FRESHRSS_URL = process.env.FRESHRSS_URL;
const FRESHRSS_API_USER = process.env.FRESHRSS_API_USER;
const FRESHRSS_API_PASSWORD = process.env.FRESHRSS_API_PASSWORD;

console.log('FRESHRSS_URL:', FRESHRSS_URL);
console.log('FRESHRSS_API_USER:', FRESHRSS_API_USER);
console.log('FRESHRSS_API_PASSWORD:', FRESHRSS_API_PASSWORD);

export async function GET(req: NextRequest) {
  if (!FRESHRSS_URL || !FRESHRSS_API_USER || !FRESHRSS_API_PASSWORD) {
    return NextResponse.json({ error: 'FreshRSS API credentials not set' }, { status: 500 });
  }

  // Step 1: Get Auth token
  const loginUrl = `${FRESHRSS_URL}/api/greader.php/accounts/ClientLogin?Email=${encodeURIComponent(FRESHRSS_API_USER)}&Passwd=${encodeURIComponent(FRESHRSS_API_PASSWORD)}`;
  const loginRes = await fetch(loginUrl);
  const loginText = await loginRes.text();
  if (!loginRes.ok) {
    return NextResponse.json({ error: 'Failed to login to FreshRSS', status: loginRes.status, body: loginText }, { status: 500 });
  }
  // Parse Auth token
  const authMatch = loginText.match(/Auth=(.+)/);
  if (!authMatch) {
    return NextResponse.json({ error: 'Failed to parse Auth token from FreshRSS', body: loginText }, { status: 500 });
  }
  const authToken = authMatch[1].trim();

  // Step 2: Use Auth token to fetch articles
  const apiUrl = `${FRESHRSS_URL}/api/greader.php/reader/api/0/stream/contents/user/-/state/com.google/reading-list?output=json&n=1000&ck=${Date.now()}`;
  const res = await fetch(apiUrl, {
    headers: {
      'Authorization': `GoogleLogin auth=${authToken}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json({ error: 'Failed to fetch from FreshRSS', status: res.status, body: errorText }, { status: 500 });
  }

  const data = await res.json();
  return NextResponse.json(data);
} 