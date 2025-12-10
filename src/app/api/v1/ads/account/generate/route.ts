import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { isAllowed } from '@/lib/author';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/v1/ads/account/callback';

export async function POST(req: Request) {
  try {
    // await isAllowed()

    const { mccId } = await req.json();

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/adwords', 'openid', 'email', 'profile'],
      prompt: 'consent',
      state: mccId,
    });

    return NextResponse.json({ success: true, url: authorizeUrl }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error }, { status: 500 });
  }
}
