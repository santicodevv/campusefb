import { FileText } from 'lucide-react';

export function GradeRecordHeader() {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <FileText className="h-7 w-7 text-blue-600" />
        Record de Notas
      </h1>
      <p className="text-gray-600 mt-1">Genera el record de notas oficial de un estudiante</p>
    </div>
  );
}
