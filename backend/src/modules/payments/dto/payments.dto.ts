import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentsQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 12;
}

export class PaymentStatsDto {
  totalFacturado: number;
  totalCobrado: number;
  totalPendiente: number;
  facturasPagadas: number;
  facturasParciales: number;
  facturasPendientes: number;
}

export class PaymentDashboardResponse {
  items: import('../interfaces/knorooms-payment.types').PaymentDashboardItem[];
  stats: PaymentStatsDto;
  total: number;
  page: number;
  limit: number;
}
