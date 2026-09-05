import { Alert, Card, CardContent } from '@/shared/components/ui';
import { useRegister } from '../hooks/useRegister';
import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  const { error, setError, isLoading, form, onSubmit } = useRegister();

  return (
    <Card className="shadow-lg">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="mt-2 text-gray-600">
            Completa tus datos para registrarte
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <RegisterForm form={form} onSubmit={onSubmit} isLoading={isLoading} />
      </CardContent>
    </Card>
  );
}
