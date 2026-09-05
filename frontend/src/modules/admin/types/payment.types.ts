export interface PaymentDetail {
  id: string;
  monto: number;
  moneda: string;
  metodo: string;
  fecha: string;
  estado: string;
}

export interface PaymentDashboardItem {
  estudiante: string;
  factura: string;
  total: number;
  pagado: number;
  pendiente: number;
  estado: 'Pagado' | 'Parcial' | 'Pendiente';
  invoiceId: string;
  fecha?: string;
  contactEmail?: string;
  moodleCode?: string;
  pagos: PaymentDetail[];
}

export interface PaymentStats {
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  facturasPagadas: number;
  facturasParciales: number;
  facturasPendientes: number;
}

export interface PaymentDashboardResponse {
  items: PaymentDashboardItem[];
  stats: PaymentStats;
  total: number;
  page: number;
  limit: number;
}

export interface PaymentsQueryParams {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export type PaymentStatus = 'Pagado' | 'Parcial' | 'Pendiente';
