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

function FieldInfo({ field }: { field: AnyFieldApi }) {
  return (
    <>
      {field.state.meta.isTouched && !field.state.meta.isValid ? <em>{field.state.meta.errors.join(', ')}</em> : null}
      {field.state.meta.isValidating ? 'Validating...' : null}
    </>
  );
}

export default function InviteInputs() {
  const form = useForm({
    defaultValues: {
      clientCustomerId: '',
    },
    onSubmit: async ({ value }) => {
      const result = await axios.post('/api/v1/invite', value);
      console.log(result?.data);
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
          <div className="px-2 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div>
                <form.Field
                  name="clientCustomerId"
                  validators={{
                    onChange: ({ value }) => (!value ? 'Customer Id is required' : undefined),
                    onChangeAsyncDebounceMs: 500,
                    onChangeAsync: async ({ value }) => {
                      await new Promise((resolve) => setTimeout(resolve, 500));
                      return value.includes('error') && 'No "error" allowed in first name';
                    },
                  }}
                  children={(field) => {
                    return (
                      <>
                        <Label>Customer ID</Label>
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
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-2 mt-6 lg:justify-start">
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <Button size="md" variant="primary" endIcon={<SendHorizontal />} disabled={!canSubmit}>
                  {isSubmitting ? '...' : 'Send'}
                </Button>
              )}
            />
          </div>
        </form>
      </div>
    </ComponentCard>
  );
}
