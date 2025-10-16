import cron from 'node-cron';
import prismaClient from '../libs/prisma'

const handleExpirePoints = async () => {
    const now = new Date();

    try {
        const result = await prismaClient.point.updateMany({
            where: {
                expiresAt: {lt : now},
                isActive: true
            }, 
            data : {
                isActive: false
            }
        });

        if (result.count > 0) {
            console.log(`Marked ${result.count} points as expired`);
        }
    } catch (error) {
        console.error("Error handling expired points:", error);
    }
};

const handleExpiredCoupons = async () => {
    const now = new Date();

    try {
        const result = await prismaClient.coupon.updateMany({
            where: {
                expiresAt: {lt: now},
                isUsed: false
            },
            data: {
                isUsed: true
            }
        });

        if (result.count > 0) {
            console.log(`Marked ${result.count} coupons as expired`);
        }

    } catch (error) {
        console.error("Error handling expired coupons:", error);
    }
};

// schedule the job to run daily at 00:01
cron.schedule("1 0 * * *" , async () => {
    console.log("Running daily expiry job ...");
    await handleExpirePoints();
    await handleExpiredCoupons();
    console.log("Daily expiry job completed");    
});

//? export for testing purpose
export { handleExpirePoints, handleExpiredCoupons };

// function to start the cron job (called in index.ts)
export const startExpiryJobs = () => {
    console.log("Scheduler for expiry cron jobs initialized");
};