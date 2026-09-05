interface DashboardHeaderProps {
  displayName?: string;
}

export function DashboardHeader({ displayName }: DashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
      <p className="mt-1 text-gray-600">Bienvenido, {displayName}</p>
    </div>
  );
}
