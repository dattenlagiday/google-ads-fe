import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { checkAllowedEmails } from '@/utils';

export const isAllowed = async () => {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    }

    const email = session.user?.email;

    if (!email || !checkAllowedEmails(email)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
}