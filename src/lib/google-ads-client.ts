import { GoogleAdsApi } from 'google-ads-api';

export const googleAdsClient = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID!,
  client_secret: process.env.GOOGLE_CLIENT_SECRET!,
  developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
});

export const getMccCustomer = () => {
  return googleAdsClient.Customer({
    customer_id: process.env.MCC_ACCOUNT_ID!,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
    login_customer_id: process.env.MCC_ACCOUNT_ID!,
  });
};
