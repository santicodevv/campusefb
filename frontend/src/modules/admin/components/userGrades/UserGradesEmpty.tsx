import { Card, CardContent } from '@/shared/components/ui';
import { Search } from 'lucide-react';

export function UserGradesEmpty() {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p className="text-gray-500">
          Busca un usuario para ver sus calificaciones
        </p>
        <p className="text-sm text-gray-400 mt-1">
          Escribe al menos 2 caracteres para comenzar la busqueda
        </p>
      </CardContent>
    </Card>
  );
}
