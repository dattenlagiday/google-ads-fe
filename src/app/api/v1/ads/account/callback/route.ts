import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis'; // Dùng để lấy info user (email, gid)
import Account from '@/models/Account';
import { connectToDB } from '@/lib/mongodb'; // Hàm connect DB của bạn

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/v1/ads/account/callback`;

// Format MCC: "4648433509" -> "464-843-3509"
function formatMccId(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 10) return raw;
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const mccId = searchParams.get('state');

  if (!code || !mccId) {
    return NextResponse.json({ error: 'Thiếu code hoặc mccId' }, { status: 400 });
  }

  const formattedMccId = formatMccId(mccId);

  try {
    await connectToDB(); // Kết nối MongoDB

    const oauth2Client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

    // 1. Đổi Code lấy Token
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // Nếu không có refresh_token (do user đã cấp quyền trước đó),
      // bạn có thể phải ép user revoke quyền hoặc force prompt ở bước generate url
      return NextResponse.json(
        { error: 'Không lấy được Refresh Token. Hãy thử lại với prompt=consent' },
        { status: 400 },
      );
    }

    // 2. Lấy thông tin User (Email, GID) để lưu cho đầy đủ
    // Thiết lập credentials rõ ràng để tránh lỗi thiếu access token
    oauth2Client.setCredentials({
      access_token: tokens.access_token ?? undefined,
      refresh_token: tokens.refresh_token,
    });

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });

    let gid: string | undefined;
    let email: string | undefined;

    try {
      const { data } = await oauth2.userinfo.get();
      gid = data.id ?? undefined;
      email = data.email ?? undefined;
    } catch (err) {
      // Không chặn flow nếu userinfo lỗi (thiếu scope, v.v.)
      console.error(
        'Failed to fetch Google userinfo. Ensure auth URL includes "openid email profile" or userinfo scopes.',
        err,
      );
    }

    const displayEmail = email ?? 'tài khoản Google Ads của bạn';

    // 3. Upsert vào MongoDB (Có thì update, chưa có thì tạo mới)
    // Logic: Tìm theo MCC ID. Vì 1 MCC chỉ cần 1 admin đại diện quản lý.
    await Account.findOneAndUpdate(
      { mcc: mccId },
      {
        gid,
        mail: email,
        mcc: mccId,
        refreshToken: tokens.refresh_token,
        accessToken: tokens.access_token,
        expiredTime: tokens.expiry_date, // Google trả về expiry_date (timestamp)
      },
      { upsert: true, new: true },
    );

    // 4. Trả về thông báo thành công (fix font + format MCC)
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="vi">
        <head>
          <meta charset="utf-8" />
          <title>Kết nối thành công</title>
        </head>
        <body style="text-align: center; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding-top: 50px;">
          <h1 style="color: green;">Kết nối thành công!</h1>
          <p>${displayEmail} đã được liên kết với MCC ${formattedMccId}.</p>
          <p>Bạn có thể đóng tab này.</p>
        </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  } catch (error) {
    console.error('Callback Error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
