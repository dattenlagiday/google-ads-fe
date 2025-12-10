'use client';
import React, { useEffect } from 'react';
import ComponentCard from '../../common/ComponentCard';
import Label from '../Label';
import Input from '../input/InputField';
import Button from '@/components/ui/button/Button';
import { SendHorizontal } from 'lucide-react';
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

export default function AccountInputs() {
  const form = useForm({
    defaultValues: {
      mccId: '',
      managerMail: '',
    },
    validators: {
      onChange: z.object({
        mccId: z.string().min(1, 'Xin hãy nhập Customer Id'),
        managerMail: z.email('Xin hãy nhập đúng định dạng email'),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      try {
        const link = await axios.post('/api/v1/ads/account/generate', {
          mccId: value.mccId,
        });
        const result = await axios.post('/api/v1/ads/mail', {
          to: value.managerMail,
          template: 1,
          data: {
            mccId: value.mccId,
            link: link.data.data.url,
          },
        });
        if (result.data.success) {
          toast.success('Gửi mail thành công!');
          formApi.reset();
        } else {
          toast.error('Gửi mail thất bại, xin thử lại sau!');
        }
      } catch (error) {
        toast.error('Xảy ra lỗi, xin thử lại sau!');
      }
    },
  });

  const foo = async () => {};
  useEffect(() => {
    foo();
  }, []);

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
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <form.Field name="mccId">
                  {(field) => {
                    return (
                      <>
                        <Label>Customer Id</Label>
                        <Input
                          type="text"
                          placeholder="XXX-XXX-XXX"
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <FieldInfo field={field} />
                      </>
                    );
                  }}
                </form.Field>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <form.Field name="managerMail">
                  {(field) => {
                    return (
                      <>
                        <Label>Manager Email</Label>
                        <Input
                          type="email"
                          placeholder="manager@sample.com"
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
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
                const { mccId, managerMail } = values as {
                  mccId?: string;
                  managerMail?: string;
                };
                const readyToSubmit = !!mccId && !!managerMail;
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
