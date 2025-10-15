export const generateCouponCode = (): string => {
    return 'DISC' + Math.random().toString(36).substring(2, 8).toUpperCase();
};