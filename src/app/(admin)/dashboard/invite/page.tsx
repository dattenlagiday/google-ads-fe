import PageBreadcrumb from '@/components/common/PageBreadCrumb';
import { Metadata } from 'next';
import React from 'react';
import InviteInputs from '@/components/form/form-elements/InviteInputs';

export const metadata: Metadata = {
  title: 'Invite | Google Ads Admin',
  description: '',
};

export default function FormElements() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Send invite" />
      <div className="grid grid-cols-1 gap-6">
        <InviteInputs />
      </div>
    </div>
  );
}
