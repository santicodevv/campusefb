import { api } from '@/shared/lib/axios';
import type { PaymentDashboardItem } from '@/modules/admin/types/payment.types';

export const studentPaymentsApi = {
  getMyInvoices() {
    return api.get<PaymentDashboardItem[]>('/payments/my/invoices');
  },
};