import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkAllowedEmails } from '@/utils';

export const isAllowed = async () => {
    const headerList = await headers();
    const session = await auth.api.getSession({
        headers: Object.fromEntries(headerList.entries()),
    });

    if (!session) {
        throw NextResponse.json({ status: 'failed', message: 'Không tìm thấy tài khoản' }, { status: 404 });
    }

    const email = session.user?.email;

    if (!email || !checkAllowedEmails(email)) {
        throw NextResponse.json({ status: 'failed', message: 'Không có quyền truy cập' }, { status: 403 });
    }

    return session;
};