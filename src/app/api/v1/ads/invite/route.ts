import { NextResponse } from 'next/server';
import { getGoogleAdsCustomer } from '@/lib/googleAdsHelper';
import { enums } from 'google-ads-api';
import { connectToDB } from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    await connectToDB();

    const { mccId, emails } = await req.json(); // emails: danh sách mail cần mời

    // Validate input
    if (!mccId || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mccId hoặc danh sách emails không hợp lệ.' },
        { status: 400 },
      );
    }

    // 1. Lấy Customer (Đã tự động xử lý token ở bước 3)
    let customer;
    try {
      customer = await getGoogleAdsCustomer(mccId);
    } catch (err: any) {
      console.error('getGoogleAdsCustomer failed:', err);
      return NextResponse.json(
        {
          success: false,
          error: 'Không lấy được Google Ads customer. Kiểm tra kết nối MCC và token.',
          details: err?.message,
        },
        { status: 400 },
      );
    }

    const results: Array<{ email: string; status: string; error?: string }> = [];

    // 2. Chạy vòng lặp Invite
    for (const email of emails) {
      try {
        await customer.mutateResources([
          {
            customer_user_access_invitation_operation: {
              create: {
                email_address: email,
                access_role: enums.AccessRole.ADMIN,
              },
            },
          } as any,
        ]);

        results.push({ email, status: 'Success' });
      } catch (err: any) {
        console.log("error", err)
        // Thử lấy message chi tiết từ Google Ads error
        let errorMsg = err?.message || 'Unknown error';

        const failureErrors = err?.failure?.errors;
        if (Array.isArray(failureErrors) && failureErrors.length > 0) {
          const first = failureErrors[0];
          const code = first?.error_code ? JSON.stringify(first.error_code) : undefined;
          const desc = first?.message;
          errorMsg = [desc, code].filter(Boolean).join(' | ');
        }

        results.push({ email, status: 'Failed', error: errorMsg });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (error: any) {
    console.error('Invite API failed:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
