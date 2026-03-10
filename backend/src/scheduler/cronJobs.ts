import * as paymentService from '../services/paymentService';
import * as waitlistService from '../services/waitlistService';
import * as slotHoldService from '../services/slotHoldService';
import { logError } from '../utils/errorLogger';

const INTERVAL_MS = 5 * 60 * 1000;

export const startCronJobs = (): void => {
  setInterval(async () => {
    try {
      const [paymentCount, waitlistCount, slotHoldCount] = await Promise.all([
        paymentService.releaseExpiredPendingPayments(),
        waitlistService.expireWaitlistOffers(),
        slotHoldService.expireSlotHolds(),
      ]);
      if (paymentCount > 0 || waitlistCount > 0 || slotHoldCount > 0) {
        process.stderr.write(
          `[Cron] Expired: ${paymentCount} payments, ${waitlistCount} waitlist offers, ${slotHoldCount} slot holds\n`
        );
      }
    } catch (err) {
      logError(err, { job: 'payment-waitlist-slot-hold-expiry' });
    }
  }, INTERVAL_MS);
};
