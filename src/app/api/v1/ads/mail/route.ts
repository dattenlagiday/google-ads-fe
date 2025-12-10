import { templateSendLinkMcc } from '@/lib/mail';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const SENDER_EMAIL = process.env.SMTP_FROM || process.env.GOOGLE_EMAIL_SENDER;
const SENDER_PASS = process.env.GOOGLE_EMAIL_APP_PASSWORD;

if (!SENDER_EMAIL || !SENDER_PASS) {
    throw new Error('Missing SENDER_EMAIL (SMTP_FROM/GOOGLE_EMAIL_SENDER) or GOOGLE_EMAIL_APP_PASSWORD env.');
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: SENDER_PASS,
    },
});

export async function POST(req: Request) {
    try {
        const { to, template, data } = await req.json();

        if (!to) {
            return NextResponse.json(
                { success: false, error: 'Missing "to" email.' },
                { status: 400 },
            );
        }

        let subject = '';
        let text = '';
        let html = '';

        switch (template) {
            // case 0:
            //     subject = 'Test Email from Google Ads App';
            //     text = `This is a test email sent to ${to} using template 0.`;
            //     html = `<p>This is a test email sent to <strong>${to}</strong> using template 0.</p>`;
            //     break;
            case 1:
                const { mccId, link } = data;
                if (!mccId || !link) {
                    return NextResponse.json(
                        { success: false, error: 'Missing data for template 1.' },
                        { status: 400 },
                    );
                }
                const { subject: s, text: t, html: h } = templateSendLinkMcc(mccId, link);
                subject = s;
                text = t;
                html = h;
                break;
            default:
                return NextResponse.json(
                    { success: false, error: 'Invalid template.' },
                    { status: 400 },
                );
        }


        await transporter.sendMail({
            from: SENDER_EMAIL,
            to,
            subject: subject,
            text: text,
            html: html,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error: any) {
        console.error('Send mail error:', error);
        return NextResponse.json(
            { success: false, error: error?.message || 'Failed to send email' },
            { status: 500 },
        );
    }
}
