import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { Badge, Button, Modal } from '@/shared/components/ui';
import type { PaymentDashboardItem } from '../../types/payment.types';

interface PaymentDetailModalProps {
  item: PaymentDashboardItem;
  onClose: () => void;
}

function formatCurrency(amount: number): string {
  return `RD$${amount.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('es-DO', { year: 'numeric', month: 'long', day: 'numeric' });
}

const statusColors = {
  Pagado: 'text-green-600 bg-green-50 border-green-200',
  Parcial: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  Pendiente: 'text-red-600 bg-red-50 border-red-200',
};

export function PaymentDetailModal({ item, onClose }: PaymentDetailModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pagosHtml = item.pagos.length > 0
      ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;">Monto</th>
              <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;">M\u00e9todo</th>
              <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;">Fecha</th>
              <th style="padding:8px;text-align:left;font-size:12px;text-transform:uppercase;">Estado</th>
            </tr>
          </thead>
          <tbody>
            ${item.pagos.map(p => `
              <tr style="border-top:1px solid #e5e7eb;">
                <td style="padding:8px;font-weight:600;">${formatCurrency(p.monto)}</td>
                <td style="padding:8px;">${p.metodo}</td>
                <td style="padding:8px;">${formatDate(p.fecha)}</td>
                <td style="padding:8px;color:#059669;">${p.estado}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>`
      : '<p style="color:#6b7280;font-size:14px;">No hay pagos registrados.</p>';

    printWindow.document.write(`
      <html>
        <head>
          <title>Factura - ${item.factura}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #1f2937; }
            h1 { font-size: 24px; margin: 0 0 4px; }
            .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
            .label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: 600; margin-top: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th { padding: 8px; text-align: left; font-size: 12px; text-transform: uppercase; background: #f3f4f6; }
            td { padding: 8px; border-top: 1px solid #e5e7eb; }
            .total-row td { font-weight: 700; border-top: 2px solid #1f2937; }
            .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${item.factura}</h1>
          <div class="subtitle">${item.estudiante}${item.moodleCode ? ` <span style="color:#9ca3af;font-size:12px;">(ID: ${item.moodleCode})</span>` : ''}${item.contactEmail ? ` &mdash; ${item.contactEmail}` : ''}</div>
          <div class="grid">
            <div>
              <div class="label">Fecha de emisi\u00f3n</div>
              <div class="value">${formatDate(item.fecha)}</div>
            </div>
            <div>
              <div class="label">Estado</div>
              <div class="value">${item.estado}</div>
            </div>
          </div>
          <h3 style="margin:0 0 4px;font-size:16px;">Pagos realizados</h3>
          ${pagosHtml}
          <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:40px;">
            <div><span class="label">Total facturado</span><div class="value">${formatCurrency(item.total)}</div></div>
            <div><span class="label">Total pagado</span><div class="value" style="color:#059669;">${formatCurrency(item.pagado)}</div></div>
            <div><span class="label">Pendiente</span><div class="value" style="color:#dc2626;">${formatCurrency(item.pendiente)}</div></div>
          </div>
          <div class="footer">Documento generado por EFB &mdash; Escuela de Formación Bíblica</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <Modal isOpen onClose={onClose} size="xl">
      <div ref={printRef}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{item.factura}</h2>
            <p className="text-sm text-gray-500">
              {item.estudiante}
              {item.moodleCode && <span className="ml-2 text-xs text-gray-400">(ID: {item.moodleCode})</span>}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            Imprimir
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Estudiante</p>
              <p className="text-sm font-medium text-gray-900">{item.estudiante}</p>
              {item.moodleCode && (
                <p className="text-xs text-gray-400 mt-0.5">ID Moodle: {item.moodleCode}</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Contacto</p>
              <p className="text-sm font-medium text-gray-900">{item.contactEmail || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Fecha de emisión</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(item.fecha)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Estado</p>
              <div className="mt-1">
                <Badge variant={item.estado === 'Pagado' ? 'success' : item.estado === 'Parcial' ? 'warning' : 'danger'}>
                  {item.estado}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Resumen de montos</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className={`rounded-lg border p-4 text-center ${statusColors[item.estado]}`}>
                <p className="text-xs uppercase tracking-wider mb-1">Total facturado</p>
                <p className="text-xl font-bold">{formatCurrency(item.total)}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-green-600 mb-1">Total pagado</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(item.pagado)}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-red-600 mb-1">Pendiente</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(item.pendiente)}</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Pagos realizados ({item.pagos.length})
            </h3>
            {item.pagos.length === 0 ? (
              <p className="text-sm text-gray-500">No hay pagos registrados para esta factura.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {item.pagos.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{formatCurrency(p.monto)}</td>
                        <td className="px-4 py-3 text-gray-600">{p.metodo}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(p.fecha)}</td>
                        <td className="px-4 py-3">
                          <Badge variant="success">{p.estado}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}