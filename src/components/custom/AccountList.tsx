'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ComponentCard from '@/components/common/ComponentCard';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import Badge from '@/components/ui/badge/Badge';
import Pagination from '@/components/tables/Pagination';
import Label from '@/components/form/Label';

type AccountItem = {
  _id: string;
  gid?: string;
  mail?: string;
  mcc: string;
  expiredTime?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

type PaginationPayload = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AccountListResponse = {
  status: 'success' | 'error';
  message: string;
  error?: string;
  data: {
    accounts: AccountItem[];
    pagination: PaginationPayload;
  } | null;
};

type DeleteResponse = {
  status: 'success' | 'error';
  message: string;
  error?: string;
  data: {
    mcc?: string;
    mail?: string;
    gid?: string;
  } | null;
};

const formatMcc = (raw: string) => {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length !== 10) return raw;
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};

const formatDateTime = (value?: number | string | null) => {
  if (value === undefined || value === null) return '--';
  const date = typeof value === 'number' ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return '--';

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value;
    }
  });

  const { year = '', month = '', day = '', hour = '', minute = '', second = '' } = lookup;
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};

const getStatus = (expiredTime?: number | null) => {
  if (expiredTime === undefined || expiredTime === null) {
    return { label: 'Live', color: 'success' as const };
  }
  return expiredTime <= Date.now()
    ? { label: 'Expired', color: 'error' as const }
    : { label: 'Live', color: 'success' as const };
};

const PAGE_SIZE = 10;

const AccountList: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<AccountItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const response = await axios.get<AccountListResponse>('/api/v1/ads/account/list', {
        params: {
          page: currentPage,
          limit: PAGE_SIZE,
          search: debouncedSearch || undefined,
        },
      });

      if (response.data.status === 'success' && response.data.data) {
        setAccounts(response.data.data.accounts);
        setTotalPages(Math.max(response.data.data.pagination.totalPages, 1));
        setTotalRecords(response.data.data.pagination.total);
      } else {
        const fallbackMessage = response.data.error || response.data.message || 'Không thể tải danh sách tài khoản.';
        setAccounts([]);
        setTotalPages(1);
        setTotalRecords(0);
        setErrorMessage(fallbackMessage);
      }
    } catch (error: any) {
      console.error('Fetch accounts error:', error);
      setAccounts([]);
      setTotalPages(1);
      setTotalRecords(0);
      setErrorMessage(error?.response?.data?.error || error?.message || 'Không thể tải danh sách tài khoản.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  };

  const handleConfirmDelete = async () => {
    if (!confirmTarget || isDeleting) return;

    try {
      setIsDeleting(true);
      const response = await axios.delete<DeleteResponse>('/api/v1/ads/account/list', {
        data: { id: confirmTarget._id, mcc: confirmTarget.mcc },
      });

      if (response.data.status === 'success') {
        setBannerMessage({
          type: 'success',
          text: response.data.message || 'Xoá tài khoản thành công.',
        });
        setConfirmTarget(null);
        await loadAccounts();
      } else {
        setBannerMessage({
          type: 'error',
          text: response.data.error || response.data.message || 'Không thể xoá tài khoản.',
        });
      }
    } catch (error: any) {
      console.error('Delete account error:', error);
      setBannerMessage({
        type: 'error',
        text: error?.response?.data?.error || error?.message || 'Không thể xoá tài khoản.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const tableRows = useMemo(
    () =>
      accounts.map((account) => {
        const status = getStatus(account.expiredTime);
        return (
          <TableRow key={account._id || account.mcc} className="hover:bg-gray-50/60 dark:hover:bg-dark-900/40">
            <TableCell className="w-[11%] py-3 text-sm font-medium text-gray-900 dark:text-white/90">
              {formatMcc(account.mcc)}
            </TableCell>
            <TableCell className="w-[17%] py-3 text-sm text-gray-600 dark:text-gray-300">
              {account.mail || '--'}
            </TableCell>
            <TableCell className="w-[17%] py-3 text-sm text-gray-600 dark:text-gray-300">
              {account.gid || '--'}
            </TableCell>
            <TableCell className="w-[11%] py-3">
              <Badge size="sm" color={status.color}>
                {status.label}
              </Badge>
            </TableCell>
            <TableCell className="w-[12%] py-3 text-sm text-gray-600 dark:text-gray-300">
              {formatDateTime(account.expiredTime ?? null)}
            </TableCell>
            <TableCell className="w-[12%] py-3 text-sm text-gray-600 dark:text-gray-300">
              {formatDateTime(account.createdAt)}
            </TableCell>
            <TableCell className="w-[12%] py-3 text-sm text-gray-600 dark:text-gray-300">
              {formatDateTime(account.updatedAt)}
            </TableCell>
            <TableCell className="w-[8%] py-3">
              <button
                type="button"
                onClick={() => setConfirmTarget(account)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 transition hover:bg-red-100 hover:text-red-700 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100 dark:hover:bg-red-500/30"
              >
                X
              </button>
            </TableCell>
          </TableRow>
        );
      }),
    [accounts],
  );

  const statusMessage = useMemo(() => {
    if (loading) return { text: 'Đang tải dữ liệu...', tone: 'info' as const };
    if (errorMessage) return { text: errorMessage, tone: 'error' as const };
    if (accounts.length === 0) return { text: 'Không có dữ liệu.', tone: 'info' as const };
    return null;
  }, [loading, errorMessage, accounts.length]);

  const statusColorClass =
    statusMessage?.tone === 'error' ? 'text-red-500 dark:text-red-400' : 'text-gray-600 dark:text-gray-200';

  return (
    <ComponentCard title="Accounts">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Linked Account List</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total: {totalRecords} accounts</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <Label htmlFor="account-search" className="sr-only">
              Search accounts
            </Label>
            <div className="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700 shadow-theme-xs focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:focus-within:border-brand-300">
              <svg
                className="h-4 w-4 text-gray-400 dark:text-gray-500"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M9.58398 16.25C13.3199 16.25 16.334 13.2359 16.334 9.5C16.334 5.76408 13.3199 2.75 9.58398 2.75C5.84805 2.75 2.83398 5.76408 2.83398 9.5C2.83398 13.2359 5.84805 16.25 9.58398 16.25Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17.5 17.5L15 15"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <input
                id="account-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by CID or Email..."
                className="h-full w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100 dark:placeholder:text-gray-500"
              />
            </div>
          </div>
        </div>

        {bannerMessage && (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              bannerMessage.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-100'
                : 'border-red-200 bg-red-50 text-red-600 dark:border-red-500/40 dark:bg-red-500/20 dark:text-red-100'
            }`}
          >
            {bannerMessage.text}
          </div>
        )}

        <div className="relative max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-y border-gray-100 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <TableRow>
                <TableCell
                  isHeader
                  className="w-[11%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Customer Id
                </TableCell>
                <TableCell
                  isHeader
                  className="w-[17%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Mail
                </TableCell>
                <TableCell
                  isHeader
                  className="w-[17%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  GID
                </TableCell>
                <TableCell
                  isHeader
                  className="w-[11%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="w-[12%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Expired Time (UTC+7)
                </TableCell>
                <TableCell
                  isHeader
                  className="w-[12%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Created At (UTC+7)
                </TableCell>
                <TableCell
                  isHeader
                  className="w-[12%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Updated At (UTC+7)
                </TableCell>
                <TableCell
                  isHeader
                  className="w-[8%] py-3 text-start text-theme-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                >
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">{tableRows}</TableBody>
          </Table>

          {statusMessage && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[52px] z-10 flex items-center justify-center bg-white/80 dark:bg-dark-900/70">
              <div
                className={`rounded-md border border-dashed border-gray-200 px-4 py-3 text-sm font-medium shadow-sm dark:border-gray-700 ${statusColorClass}`}
              >
                {statusMessage.text}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
        </div>
      </div>

      {confirmTarget && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-dark-900">
            <h4 className="text-base font-semibold text-gray-900 dark:text-white">Xoá tài khoản?</h4>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Bạn có chắc chắn muốn xoá tài khoản với CID{' '}
              <span className="font-semibold">{formatMcc(confirmTarget.mcc)}</span>? Thao tác này không thể hoàn tác.
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-white/[0.05]"
                onClick={() => {
                  if (!isDeleting) setConfirmTarget(null);
                }}
              >
                Huỷ
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-lg border border-red-400 bg-red-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Đang xoá...' : 'Xoá tài khoản'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ComponentCard>
  );
};

export default AccountList;
