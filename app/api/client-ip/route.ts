import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip'); // Cloudflare

  const ip = cfIp || (forwarded ? forwarded.split(',')[0].trim() : null) || realIp || 'unknown';

  return NextResponse.json({ ip });
}
