interface StudentDashboardHeaderProps {
  displayName?: string | null;
}

export function StudentDashboardHeader({ displayName }: StudentDashboardHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Bienvenido, {displayName}
      </h1>
      <p className="mt-1 text-gray-600">
        Panel de estudiante - Resumen de tu actividad académica
      </p>
    </div>
  );
}
