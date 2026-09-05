import { Button } from '@/shared/components/ui';
import { Plus } from 'lucide-react';

interface TranscriptsHeaderProps {
  onGenerateClick: () => void;
}

export function TranscriptsHeader({ onGenerateClick }: TranscriptsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Constancias</h1>
        <p className="mt-1 text-gray-600">
          Generación y gestión de récord académico oficial
        </p>
      </div>
      <Button onClick={onGenerateClick}>
        <Plus className="h-4 w-4 mr-2" />
        Generar Constancia
      </Button>
    </div>
  );
}
