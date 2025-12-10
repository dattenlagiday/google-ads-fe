import Account from '@/models/Account';
import { OAuth2Client } from 'google-auth-library';
import { GoogleAdsApi } from 'google-ads-api';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

export async function getGoogleAdsCustomer(mccId: string) {
  // 1. Lấy record từ DB
  const account = await Account.findOne({ mcc: mccId });

  if (!account) {
    throw new Error(`MCC ${mccId} chưa được kết nối.`);
  }

  let accessToken = account.accessToken;
  const now = Date.now();

  // 2. Kiểm tra hết hạn (Trừ hao 5 phút cho chắc ăn)
  // expiredTime là timestamp (ms)
  if (!accessToken || !account.expiredTime || account.expiredTime < now + 5 * 60 * 1000) {
    console.log(`Token của MCC ${mccId} đã hết hạn. Đang refresh...`);

    const authClient = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
    authClient.setCredentials({
      refresh_token: account.refreshToken,
    });

    // Lấy token mới
    const { credentials } = await authClient.refreshAccessToken();

    // Cập nhật vào DB để lần sau dùng tiếp
    accessToken = credentials.access_token!;
    await Account.updateOne(
      { _id: account._id },
      {
        accessToken: accessToken,
        expiredTime: credentials.expiry_date,
      },
    );
  }

  // 3. Khởi tạo Google Ads Client với Access Token còn sống
  const client = new GoogleAdsApi({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
  });

  const formattedMcc = mccId.replace(/-/g, '');

  // Load Customer.
  // Lưu ý: Khi đã có access_token tươi, ta truyền vào credentials để thư viện dùng luôn
  const customer = client.Customer({
    customer_id: formattedMcc,
    refresh_token: account.refreshToken, // Vẫn cần truyền để thư viện backup
    login_customer_id: formattedMcc,
  });

  // Ép thư viện dùng access token mới nhất (Optimization)
  // customer.credentials.access_token = accessToken;

  return customer;
}
