import * as paymentService from '../services/paymentService';
import * as waitlistService from '../services/waitlistService';
import { logError } from '../utils/errorLogger';

const INTERVAL_MS = 5 * 60 * 1000;

export const startCronJobs = (): void => {
  setInterval(async () => {
    try {
      const [paymentCount, waitlistCount] = await Promise.all([
        paymentService.releaseExpiredPendingPayments(),
        waitlistService.expireWaitlistOffers(),
      ]);
      if (paymentCount > 0 || waitlistCount > 0) {
        process.stderr.write(
          `[Cron] Expired: ${paymentCount} payments, ${waitlistCount} waitlist offers\n`
        );
      }
    } catch (err) {
      logError(err, { job: 'payment-waitlist-expiry' });
    }
  }, INTERVAL_MS);
};
