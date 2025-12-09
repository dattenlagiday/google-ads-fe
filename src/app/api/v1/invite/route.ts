import { NextResponse } from 'next/server';
import { getMccCustomer } from '@/lib/google-ads-client';
import { enums } from 'google-ads-api';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { checkAllowedEmails } from '@/utils';

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const email = session.user?.email;

    if (!email || !checkAllowedEmails(email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { clientCustomerId } = body ?? {};

    if (!clientCustomerId || typeof clientCustomerId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid clientCustomerId' }, { status: 400 });
    }

    // Chuẩn hoá ID: bỏ dấu gạch ngang và đảm bảo chỉ chứa số
    const formattedClientId = clientCustomerId.replace(/-/g, '');

    if (!/^[0-9]+$/.test(formattedClientId)) {
      return NextResponse.json({ error: 'Invalid clientCustomerId format' }, { status: 400 });
    }

    const customer = getMccCustomer();

    // Dùng mutateResources với customer_client_link_operation đúng kiểu
    const mutateResponse = await customer.mutateResources([
      {
        customer_client_link_operation: {
          create: {
            client_customer: `customers/${formattedClientId}`,
            status: enums.ManagerLinkStatus.PENDING,
          },
        },
      } as any, // cast any để tương thích với kiểu MutateOperation của thư viện
    ]);

    const firstResult = (mutateResponse as any)?.results?.[0];

    if (!firstResult) {
      return NextResponse.json({ success: false, error: 'No result returned from Google Ads API' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Invite sent successfully',
      resourceName: firstResult.resource_name,
    });
  } catch (error: any) {
    console.error('Google Ads API Error:', error);

    let errorMessage = 'Internal Server Error';

    if (error?.errors && Array.isArray(error.errors) && error.errors[0]?.message) {
      errorMessage = error.errors[0].message;
    } else if (typeof error?.message === 'string') {
      errorMessage = error.message;
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
