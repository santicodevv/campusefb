import { Card, CardContent, Button, Input, Label } from '@/shared/components/ui';

interface PeriodCreateFormProps {
  newPeriod: { code: string; name: string; startDate: string; endDate: string; description: string };
  setNewPeriod: React.Dispatch<React.SetStateAction<{ code: string; name: string; startDate: string; endDate: string; description: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function PeriodCreateForm({
  newPeriod,
  setNewPeriod,
  onSubmit,
  isPending,
  onCancel,
}: PeriodCreateFormProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold mb-4">Crear Nuevo Período</h3>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                value={newPeriod.code}
                onChange={(e) => setNewPeriod({ ...newPeriod, code: e.target.value })}
                placeholder="Ej: 2026.2"
                required
              />
            </div>
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={newPeriod.name}
                onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                placeholder="Ej: Segundo Semestre 2026"
                required
              />
            </div>
            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={newPeriod.startDate}
                onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={newPeriod.endDate}
                onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              Crear Período
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
