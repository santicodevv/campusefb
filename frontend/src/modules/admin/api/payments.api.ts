import { api } from '@/shared/lib/axios';
import type { PaymentDashboardResponse, PaymentsQueryParams, PaymentStats } from '../types/payment.types';

import type { PaymentDashboardItem } from '../types/payment.types';

export const paymentsApi = {
  getDashboard(params?: PaymentsQueryParams) {
    return api.get<PaymentDashboardResponse>('/payments/dashboard', { params });
  },

  getStats() {
    return api.get<PaymentStats>('/payments/stats');
  },

  getStudentInvoices(search: string) {
    return api.get('/payments/students', { params: { search } });
  },

  getInvoiceDetail(invoiceId: string) {
    return api.get<PaymentDashboardItem>(`/payments/${invoiceId}`);
  },
};
