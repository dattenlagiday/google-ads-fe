import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/mongodb';
import Account from '@/models/Account';
import { isAllowed } from '@/lib/author';

export async function GET(req: Request) {
    try {
        await isAllowed();
        await connectToDB();

        const { searchParams } = new URL(req.url);
        const pageParam = searchParams.get('page') ?? '1';
        const limitParam = searchParams.get('limit') ?? '10';
        const search = (searchParams.get('search') ?? '').trim();

        const page = Math.max(parseInt(pageParam, 10) || 1, 1);
        const limit = Math.max(parseInt(limitParam, 10) || 10, 1);
        const skip = (page - 1) * limit;

        const filter: Record<string, unknown> = {};
        if (search) {
            const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            filter.$or = [{ mcc: regex }, { mail: regex }];
        }

        const [items, total] = await Promise.all([
            Account.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select('gid mail mcc expiredTime createdAt updatedAt')
                .lean(),
            Account.countDocuments(filter),
        ]);

        const totalPages = Math.max(Math.ceil(total / limit), 1);

        return NextResponse.json(
            {
                status: 'success',
                message: 'Lấy danh sách tài khoản thành công.',
                data: {
                    accounts: items,
                    pagination: { page, limit, total, totalPages },
                },
            },
            { status: 200 },
        );
    } catch (error) {
        if (error instanceof Response) return error;

        console.error('List accounts API error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Không thể lấy danh sách tài khoản.',
                error: (error as Error)?.message ?? 'Internal server error',
                data: null,
            },
            { status: 500 },
        );
    }
}

export async function DELETE(req: Request) {
    try {
        await isAllowed();
        await connectToDB();

        const { id, mcc } = await req.json();

        if (!id && !mcc) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Thiếu dữ liệu đầu vào.',
                    error: 'Cần truyền id hoặc mcc để xoá tài khoản.',
                    data: null,
                },
                { status: 400 },
            );
        }

        const conditions = id ? { _id: id } : { mcc };
        const deletedAccount = await Account.findOneAndDelete(conditions);

        if (!deletedAccount) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Không tìm thấy tài khoản cần xoá.',
                    error: 'Account not found',
                    data: null,
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                status: 'success',
                message: 'Xoá tài khoản thành công.',
                data: {
                    mcc: deletedAccount.mcc,
                    mail: deletedAccount.mail,
                    gid: deletedAccount.gid,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        if (error instanceof Response) return error;

        console.error('Delete account API error:', error);
        return NextResponse.json(
            {
                status: 'error',
                message: 'Không thể xoá tài khoản.',
                error: (error as Error)?.message ?? 'Internal server error',
                data: null,
            },
            { status: 500 },
        );
    }
}
