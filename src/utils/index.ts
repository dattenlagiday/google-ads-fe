export const checkAllowedEmails = (emails: string): boolean => {
  const allowedEmails = process.env.ALLOWED_EMAILS?.split(',');
  return allowedEmails?.includes(emails) ?? false;
};
