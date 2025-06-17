import type { NextApiRequest, NextApiResponse } from 'next';

type HealthResponse = {
  status: string;
  timestamp: string;
  uptime: number;
  version: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  // Return health status with static values to avoid Node.js process dependency
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: 0, // Static value since we can't access process.uptime() in Edge runtime
    version: '1.0.0'
  });
} 