'use client';
import React, { useEffect, useState } from 'react';
import ComponentCard from '../../common/ComponentCard';
import Label from '../Label';
import Button from '@/components/ui/button/Button';
import type { AnyFieldApi } from '@tanstack/react-form';
import { useForm } from '@tanstack/react-form';
import axios from 'axios';
import { PaperPlaneIcon } from '@/icons';
import toast from 'react-hot-toast';
import { z } from 'zod';

function FieldInfo({ field }: { field: AnyFieldApi }) {
  const { meta } = field.state;

  if (!meta.isTouched || meta.isValid) return null;

  const errorText = meta.errors
    .map((err: any) => {
      if (!err) return '';
      if (typeof err === 'string') return err;
      if (typeof err.message === 'string') return err.message;
      return JSON.stringify(err);
    })
    .filter(Boolean)
    .join(', ');

  return (
    <span className="text-sm text-red-500">
      <em>{errorText}</em>
    </span>
  );
}

// Format MCC: "4648433509" -> "464-843-3509"
const formatMccId = (raw: string): string => {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length !== 10) return raw;
  return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};

type AccountItem = {
  gid?: string;
  mail?: string;
  mcc: string;
  expiredTime?: number;
  createdAt?: string;
  updatedAt?: string;
};

const showWarningToast = (message: string) => {
  const warningFn = (toast as any)?.warning;
  if (typeof warningFn === 'function') {
    warningFn(message);
  } else {
    toast(message, { icon: '⚠️' });
  }
};

const INVITE_DEFAULT_VALUES = {
  mccId: '',
  emails: [] as string[],
};

export default function AccountInputs() {
  const [mccSearch, setMccSearch] = useState('');
  const [mccDropdownOpen, setMccDropdownOpen] = useState(false);
  const [mccOptions, setMccOptions] = useState<AccountItem[]>([]);
  const [mccLoading, setMccLoading] = useState(false);

  const [emailInput, setEmailInput] = useState('');

  const form = useForm({
    defaultValues: INVITE_DEFAULT_VALUES,
    validators: {
      onChange: z.object({
        mccId: z.string().min(1, 'Xin hãy chọn Customer Id'),
        emails: z.array(z.string().email('Xin hãy nhập đúng định dạng email')).min(1, 'Xin hãy nhập ít nhất 1 email'),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const res = await axios.post('/api/v1/ads/invite', {
          mccId: value.mccId,
          emails: value.emails,
        });

        const summary = res.data?.summary ?? {
          total: value.emails.length,
          successCount: 0,
          failureCount: value.emails.length,
        };
        const { total, successCount, failureCount } = summary;
        const ratioMessage = `Gửi invite thành công ${successCount}/${total}!`;

        if (successCount === total && total > 0) {
          toast.success(ratioMessage);
          formApi.reset();
        } else if (successCount > 0) {
          showWarningToast(ratioMessage);
          if (Array.isArray(res.data?.data)) {
            const failedEmails = res.data.data
              .filter((item: any) => item.status !== 'Success')
              .map((item: any) => item.email);
            formApi.setFieldValue('emails', failedEmails);
          }
        } else {
          toast.error(ratioMessage);
        }

        if (failureCount === total && res.data?.error) {
          showWarningToast(res.data.error);
        }
      } catch (error: any) {
        console.error(error);
        toast.error('Xảy ra lỗi, xin thử lại sau!');
      }
    },
  });

  // Debounce search MCC 0.5s
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        setMccLoading(true);
        const res = await axios.get('/api/v1/ads/account/list', {
          params: {
            search: mccSearch || undefined,
            page: 1,
            limit: 10,
          },
        });
        if (!active) return;
        setMccOptions(res.data?.data?.accounts || []);
      } catch (e) {
        console.error('Fetch MCC list error:', e);
      } finally {
        if (active) setMccLoading(false);
      }
    }, 500);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [mccSearch]);

  useEffect(() => {
    // load initial MCC list
    setMccSearch('');
  }, []);

  const foo = async () => {};
  useEffect(() => {
    foo();
  }, []);

  // Thêm email vào mảng khi Enter
  const addEmailToField = (field: AnyFieldApi) => {
    const value = emailInput.trim();
    if (!value) return;
    const current: string[] = field.state.value || [];
    if (current.includes(value)) {
      setEmailInput('');
      return;
    }
    field.handleChange([...current, value]);
    setEmailInput('');
  };

  return (
    <ComponentCard title="Inputs">
      <div className="space-y-6">
        <form
          className="flex flex-col"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="space-y-6">
            {/* Customer Id - searchable select */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <form.Field name="mccId">
                  {(field) => {
                    const selectedMcc = field.state.value;
                    const selectedAccount = mccOptions.find((a) => a.mcc === selectedMcc);
                    const selectedLabel = selectedAccount
                      ? `${formatMccId(selectedAccount.mcc)}${selectedAccount.mail ? ` - ${selectedAccount.mail}` : ''}`
                      : selectedMcc
                        ? formatMccId(selectedMcc)
                        : '';

                    return (
                      <>
                        <Label>Customer Id</Label>
                        <div className="relative">
                          {/* Trigger */}
                          <button
                            type="button"
                            onClick={() => setMccDropdownOpen((prev) => !prev)}
                            className="flex w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-900 dark:text-gray-100"
                          >
                            <span>{selectedLabel || '---'}</span>
                            <span className="ml-2 text-xs text-gray-400">▼</span>
                          </button>

                          {mccDropdownOpen && (
                            <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg dark:border-dark-500 dark:bg-dark-900">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={mccSearch}
                                  onChange={(e) => setMccSearch(e.target.value)}
                                  placeholder="Search by CID or Email..."
                                  className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-dark-500 dark:bg-dark-800 dark:text-gray-100"
                                />
                              </div>
                              <div className="max-h-56 overflow-auto py-1 text-sm text-gray-900 dark:text-gray-100">
                                {mccLoading && (
                                  <div className="px-3 py-2 text-gray-400 dark:text-gray-500">Đang tải...</div>
                                )}
                                {!mccLoading && mccOptions.length === 0 && (
                                  <div className="px-3 py-2 text-gray-400 dark:text-gray-500">
                                    Không tìm thấy kết quả
                                  </div>
                                )}
                                {!mccLoading &&
                                  mccOptions.map((opt) => {
                                    const label = `${formatMccId(opt.mcc)}${opt.mail ? ` - ${opt.mail}` : ''}`;
                                    const active = field.state.value === opt.mcc;
                                    return (
                                      <button
                                        key={opt.mcc}
                                        type="button"
                                        onClick={() => {
                                          field.handleChange(opt.mcc);
                                          setMccDropdownOpen(false);
                                        }}
                                        className={`block w-full cursor-pointer px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-dark-800 ${
                                          active ? 'bg-gray-100 font-medium dark:bg-dark-800' : ''
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                        </div>
                        <FieldInfo field={field} />
                      </>
                    );
                  }}
                </form.Field>
              </div>
            </div>

            {/* Emails - multiple chips */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <form.Field name="emails">
                  {(field) => {
                    const emails: string[] = field.state.value || [];
                    return (
                      <>
                        <Label>Mails</Label>
                        <div className="flex flex-wrap items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-2 dark:border-dark-500 dark:bg-dark-900">
                          {emails.map((email, idx) => (
                            <span
                              key={email + idx}
                              className="group flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
                            >
                              <span className="flex-initial max-w-full">{email}</span>
                              <button
                                type="button"
                                onClick={() => field.handleChange(emails.filter((_, i) => i !== idx))}
                                className="pl-2 text-gray-500 cursor-pointer group-hover:text-gray-400 dark:text-gray-400"
                              >
                                ✕
                              </button>
                            </span>
                          ))}
                          <input
                            type="email"
                            placeholder="Nhập email và nhấn Enter"
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addEmailToField(field);
                              }
                            }}
                            className="flex-1 min-w-[120px] border-none bg-transparent px-1 py-1 text-sm text-gray-900 focus:outline-none dark:text-gray-100"
                          />
                        </div>
                        <FieldInfo field={field} />
                      </>
                    );
                  }}
                </form.Field>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-start">
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting, state.values] as const}>
              {([canSubmit, isSubmitting, values]) => {
                const { mccId, emails } = values as {
                  mccId?: string;
                  emails?: string[];
                };
                const readyToSubmit = !!mccId && (emails?.length ?? 0) > 0;

                return (
                  <Button
                    size="md"
                    variant="primary"
                    endIcon={<PaperPlaneIcon />}
                    disabled={!readyToSubmit || isSubmitting}
                  >
                    {isSubmitting ? '...' : 'Send'}
                  </Button>
                );
              }}
            </form.Subscribe>
          </div>
        </form>
      </div>
    </ComponentCard>
  );
}
