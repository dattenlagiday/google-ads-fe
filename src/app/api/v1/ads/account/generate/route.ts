import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { isAllowed } from '@/lib/author';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.NEXT_PUBLIC_BASE_URL + '/api/v1/ads/account/callback';

export async function POST(req: Request) {
  try {
    await isAllowed();

    const { mccId } = await req.json();

    if (!mccId) {
      return NextResponse.json(
        { status: 'error', message: 'Thiếu mccId trong request body.', error: 'mccId is required', data: null },
        { status: 400 },
      );
    }

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const authorizeUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/adwords', 'openid', 'email', 'profile'],
      prompt: 'consent',
      state: mccId,
    });

    return NextResponse.json(
      { status: 'success', message: 'Tạo liên kết ủy quyền thành công.', data: { url: authorizeUrl } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    console.error('Generate account auth URL error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Không thể tạo liên kết ủy quyền.',
        error: (error as Error)?.message ?? 'Internal server error',
        data: null,
      },
      { status: 500 },
    );
  }
}
