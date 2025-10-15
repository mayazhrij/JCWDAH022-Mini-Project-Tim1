// utils/helpers.ts

/**
 * Menghasilkan kode referral acak dan unik (8 karakter).
 * @returns {string} Kode referral dalam huruf kapital.
 */
export const generateReferralCode = (): string => {
  // Menggunakan substring(2, 10) akan menghasilkan 8 karakter acak
    return Math.random().toString(36).substring(2, 10).toUpperCase();
};