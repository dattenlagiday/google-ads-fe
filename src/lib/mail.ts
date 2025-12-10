// Format MCC: "4648433509" -> "464-843-3509"
const formatMccId = (raw: string): string => {
    const digits = (raw || '').replace(/\D/g, '');
    if (digits.length !== 10) return raw;
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
};

export const templateSendLinkMcc = (mccId: string, link: string) => {
    const formattedMccId = formatMccId(mccId);

    const subject = 'Liên kết tài khoản MCC';

    const text =
        `Bạn đang yêu cầu liên kết tài khoản manager đến MCC với ID: ${formattedMccId}\n` +
        `Xin vui lòng nhấn vào đây để liên kết: ${link}`;

    const html = `
    <p>
      Bạn đang yêu cầu liên kết tài khoản manager đến MCC với ID:
      <strong>${formattedMccId}</strong>
    </p>
    <p>
      Xin vui lòng nhấn vào đây để liên kết:
      <a href="${link}">Link</a>
    </p>
  `;

    return { subject, text, html };
};