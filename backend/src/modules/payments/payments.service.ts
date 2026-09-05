import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import axios, { AxiosInstance } from 'axios';
import type {
  KnoroomInvoice,
  KnoroomPayment,
  PaymentDashboardItem,
} from './interfaces/knorooms-payment.types';
import type { PaymentsQueryDto, PaymentStatsDto } from './dto/payments.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly apiClient: AxiosInstance;
  private readonly locationId: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {
    const baseURL =
      this.configService.get<string>('PAYMENTS_API_URL') ||
      'https://services.leadconnectorhq.com';
    const token = this.configService.get<string>('PAYMENTS_API_TOKEN') || '';
    this.locationId =
      this.configService.get<string>('PAYMENTS_LOCATION_ID') || '';

    this.apiClient = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Version: '2021-07-28',
      },
      timeout: 15000,
    });
  }

  private getParams(): Record<string, string> {
    const params: Record<string, string> = {
      limit: '100',
      offset: '0',
    };
    if (this.locationId) {
      params.altId = this.locationId;
      params.altType = 'location';
    }
    return params;
  }

  private async buildContactMoodleMap(): Promise<Map<string, string>> {
    const users = await this.userRepo.find({
      where: { moodleUserId: Not(IsNull()) },
      select: ['email', 'displayName', 'moodleUserId'],
    });

    const map = new Map<string, string>();
    for (const user of users) {
      const code = String(user.moodleUserId);
      if (user.email) {
        map.set(user.email.toLowerCase().trim(), code);
      }
      if (user.displayName) {
        map.set(user.displayName.toLowerCase().trim(), code);
      }
    }
    return map;
  }

  private enrichItem(
    item: PaymentDashboardItem,
    contactMap: Map<string, string>,
  ): PaymentDashboardItem {
    const email = item.contactEmail?.toLowerCase().trim();
    const name = item.estudiante?.toLowerCase().trim();

    let moodleCode: string | undefined;
    if (email && contactMap.has(email)) {
      moodleCode = contactMap.get(email);
    } else if (name && contactMap.has(name)) {
      moodleCode = contactMap.get(name);
    }

    return { ...item, moodleCode };
  }

  private enrichItems(
    items: PaymentDashboardItem[],
    contactMap: Map<string, string>,
  ): PaymentDashboardItem[] {
    return items.map((item) => this.enrichItem(item, contactMap));
  }

  async getInvoices(): Promise<KnoroomInvoice[]> {
    try {
      const { data } = await this.apiClient.get('/invoices/', {
        params: this.getParams(),
      });
      return data.invoices || data || [];
    } catch (error) {
      this.logger.error('Error fetching invoices', error.message);
      throw new HttpException(
        'Error al obtener facturas de EFB',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async getPayments(): Promise<KnoroomPayment[]> {
    try {
      const { data } = await this.apiClient.get('/payments/transactions', {
        params: this.getParams(),
      });
      return data.transactions || data.payments || data || [];
    } catch (error) {
      this.logger.warn('Error fetching payments (non-fatal): ' + error.message);
      return [];
    }
  }

  async getDashboard(query: PaymentsQueryDto): Promise<{
    items: PaymentDashboardItem[];
    stats: PaymentStatsDto;
    total: number;
    page: number;
    limit: number;
  }> {
    const [invoices, payments, contactMap] = await Promise.all([
      this.getInvoices(),
      this.getPayments(),
      this.buildContactMoodleMap(),
    ]);

    const items: PaymentDashboardItem[] = invoices.map((inv) => {
      const pagosFactura = payments.filter(
        (p) => p.invoiceId === inv._id && p.status === 'success',
      );
      const totalPagado = pagosFactura.reduce((sum, p) => sum + p.amount, 0);
      const pendiente = Math.max(0, (inv.amountDue ?? inv.total) - totalPagado);

      let estado: PaymentDashboardItem['estado'];
      if (pendiente <= 0) {
        estado = 'Pagado';
      } else if (totalPagado > 0) {
        estado = 'Parcial';
      } else {
        estado = 'Pendiente';
      }

      return {
        estudiante: inv.contactDetails?.name || 'Desconocido',
        factura: inv.invoiceNumber
          ? `Factura #${inv.invoiceNumber}`
          : inv.title || `Factura #${inv._id}`,
        total: inv.total,
        pagado: totalPagado,
        pendiente,
        estado,
        invoiceId: inv._id,
        fecha: inv.createdAt,
        contactEmail: inv.contactDetails?.email,
        pagos: pagosFactura.map((p) => ({
          id: p.id,
          monto: p.amount,
          moneda: p.currency || 'RD$',
          metodo: p.method || 'Desconocido',
          fecha: p.createdAt || '',
          estado: p.status,
        })),
      };
    });

    const enriched = this.enrichItems(items, contactMap);

    let filtered = enriched;
    if (query.search) {
      const s = query.search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.estudiante.toLowerCase().includes(s) ||
          i.factura.toLowerCase().includes(s),
      );
    }
    if (query.status) {
      filtered = filtered.filter(
        (i) => i.estado.toLowerCase() === query.status!.toLowerCase(),
      );
    }

    const stats: PaymentStatsDto = {
      totalFacturado: enriched.reduce((s, i) => s + i.total, 0),
      totalCobrado: enriched.reduce((s, i) => s + i.pagado, 0),
      totalPendiente: enriched.reduce((s, i) => s + i.pendiente, 0),
      facturasPagadas: enriched.filter((i) => i.estado === 'Pagado').length,
      facturasParciales: enriched.filter((i) => i.estado === 'Parcial').length,
      facturasPendientes: enriched.filter((i) => i.estado === 'Pendiente')
        .length,
    };

    const total = filtered.length;
    const page = query.page || 1;
    const limit = query.limit || 12;
    const start = (page - 1) * limit;
    const paginated = filtered.slice(start, start + limit);

    return { items: paginated, stats, total, page, limit };
  }

  async getStats(): Promise<PaymentStatsDto> {
    const { stats } = await this.getDashboard({ page: 1, limit: 1 });
    return stats;
  }

  async getInvoiceDetail(
    invoiceId: string,
  ): Promise<PaymentDashboardItem | null> {
    const [invoices, payments, contactMap] = await Promise.all([
      this.getInvoices(),
      this.getPayments(),
      this.buildContactMoodleMap(),
    ]);

    const inv = invoices.find((i) => i._id === invoiceId);
    if (!inv) return null;

    const pagosFactura = payments.filter(
      (p) => p.invoiceId === inv._id && p.status === 'success',
    );
    const totalPagado = pagosFactura.reduce((sum, p) => sum + p.amount, 0);
    const pendiente = Math.max(0, (inv.amountDue ?? inv.total) - totalPagado);

    const item: PaymentDashboardItem = {
      estudiante: inv.contactDetails?.name || 'Desconocido',
      factura: inv.invoiceNumber
        ? `Factura #${inv.invoiceNumber}`
        : inv.title || `Factura #${inv._id}`,
      total: inv.total,
      pagado: totalPagado,
      pendiente,
      estado:
        pendiente <= 0 ? 'Pagado' : totalPagado > 0 ? 'Parcial' : 'Pendiente',
      invoiceId: inv._id,
      fecha: inv.createdAt,
      contactEmail: inv.contactDetails?.email,
      pagos: pagosFactura.map((p) => ({
        id: p.id,
        monto: p.amount,
        moneda: p.currency || 'RD$',
        metodo: p.method || 'Desconocido',
        fecha: p.createdAt || '',
        estado: p.status,
      })),
    };

    return this.enrichItem(item, contactMap);
  }

  async getMyInvoices(user: {
    displayName?: string | null;
    email: string;
  }): Promise<PaymentDashboardItem[]> {
    const [invoices, payments, contactMap] = await Promise.all([
      this.getInvoices(),
      this.getPayments(),
      this.buildContactMoodleMap(),
    ]);

    const name = user.displayName?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';

    const matched = invoices.filter((inv) => {
      const cName = inv.contactDetails?.name?.toLowerCase() || '';
      const cEmail = inv.contactDetails?.email?.toLowerCase() || '';
      return (
        (name && cName.includes(name)) ||
        (name && name.includes(cName)) ||
        (email && cEmail === email)
      );
    });

    const items: PaymentDashboardItem[] = matched.map((inv) => {
      const pagosFactura = payments.filter(
        (p) => p.invoiceId === inv._id && p.status === 'success',
      );
      const totalPagado = pagosFactura.reduce((sum, p) => sum + p.amount, 0);
      const pendiente = Math.max(0, (inv.amountDue ?? inv.total) - totalPagado);

      return {
        estudiante: inv.contactDetails?.name || 'Desconocido',
        factura: inv.invoiceNumber
          ? `Factura #${inv.invoiceNumber}`
          : inv.title || `Factura #${inv._id}`,
        total: inv.total,
        pagado: totalPagado,
        pendiente,
        estado:
          pendiente <= 0 ? 'Pagado' : totalPagado > 0 ? 'Parcial' : 'Pendiente',
        invoiceId: inv._id,
        fecha: inv.createdAt,
        contactEmail: inv.contactDetails?.email,
        pagos: pagosFactura.map((p) => ({
          id: p.id,
          monto: p.amount,
          moneda: p.currency || 'RD$',
          metodo: p.method || 'Desconocido',
          fecha: p.createdAt || '',
          estado: p.status,
        })),
      };
    });

    return this.enrichItems(items, contactMap);
  }

  async getStudentInvoices(search: string): Promise<PaymentDashboardItem[]> {
    const [invoices, payments, contactMap] = await Promise.all([
      this.getInvoices(),
      this.getPayments(),
      this.buildContactMoodleMap(),
    ]);
    const s = search.toLowerCase();

    const filtered = invoices.filter(
      (inv) =>
        inv.contactDetails?.name?.toLowerCase().includes(s) ||
        inv._id?.toLowerCase().includes(s),
    );

    const items: PaymentDashboardItem[] = filtered.map((inv) => {
      const pagosFactura = payments.filter(
        (p) => p.invoiceId === inv._id && p.status === 'success',
      );
      const totalPagado = pagosFactura.reduce((sum, p) => sum + p.amount, 0);
      const pendiente = Math.max(0, (inv.amountDue ?? inv.total) - totalPagado);

      return {
        estudiante: inv.contactDetails?.name || 'Desconocido',
        factura: inv.invoiceNumber
          ? `Factura #${inv.invoiceNumber}`
          : inv.title || `Factura #${inv._id}`,
        total: inv.total,
        pagado: totalPagado,
        pendiente,
        estado:
          pendiente <= 0 ? 'Pagado' : totalPagado > 0 ? 'Parcial' : 'Pendiente',
        invoiceId: inv._id,
        fecha: inv.createdAt,
        contactEmail: inv.contactDetails?.email,
        pagos: pagosFactura.map((p) => ({
          id: p.id,
          monto: p.amount,
          moneda: p.currency || 'RD$',
          metodo: p.method || 'Desconocido',
          fecha: p.createdAt || '',
          estado: p.status,
        })),
      };
    });

    return this.enrichItems(items, contactMap);
  }
}
