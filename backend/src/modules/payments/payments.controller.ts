import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsQueryDto } from './dto/payments.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RoleCode } from '../users/entities/role.entity';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(RoleCode.ADMIN)
  @Get('dashboard')
  async getDashboard(@Query() query: PaymentsQueryDto) {
    return this.paymentsService.getDashboard(query);
  }

  @Roles(RoleCode.ADMIN)
  @Get('stats')
  async getStats() {
    return this.paymentsService.getStats();
  }

  @Roles(RoleCode.STUDENT, RoleCode.ADMIN)
  @Get('my/invoices')
  async getMyInvoices(@CurrentUser() user: any) {
    return this.paymentsService.getMyInvoices(user);
  }

  @Roles(RoleCode.ADMIN)
  @Get('students')
  async getStudentInvoices(@Query('search') search: string) {
    return this.paymentsService.getStudentInvoices(search || '');
  }

  @Roles(RoleCode.ADMIN)
  @Get(':invoiceId')
  async getInvoiceDetail(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.getInvoiceDetail(invoiceId);
  }
}
