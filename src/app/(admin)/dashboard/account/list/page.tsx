import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Metadata } from 'next';
import React from 'react';
import AccountInputs from '@/components/form/form-elements/AccountInputs';
import AccountList from '@/components/custom/AccountList';

export const metadata: Metadata = {
  title: 'Get Token | Google Ads Admin',
  description: '',
};

export default function FormElements() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Get Manager Token" />
      <div className="grid grid-cols-1 gap-6">
        <AccountList />
      </div>
    </div>
  );
}
