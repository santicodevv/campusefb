export interface KnoroomInvoice {
  _id: string;
  contactDetails?: {
    id?: string;
    name?: string;
    email?: string;
    phoneNo?: string;
  };
  title?: string;
  invoiceNumber?: string;
  total: number;
  amountPaid?: number;
  amountDue?: number;
  currency?: string;
  status: string;
  issueDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface KnoroomPayment {
  id: string;
  invoiceId: string;
  amount: number;
  currency?: string;
  status: 'success' | 'failed' | 'pending';
  method?: string;
  createdAt?: string;
}

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
