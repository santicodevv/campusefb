// Login Page
import { Alert, Card, CardContent } from '@/shared/components/ui';
import { useLogin } from '../hooks/useLogin';
import { LoginForm } from '../components/LoginForm';
import { SessionExpiredModal } from '../components/SessionExpiredModal';

export function LoginPage() {
  const {
    error,
    setError,
    sessionExpired,
    isLoading,
    form,
    onSubmit,
    handleAcknowledgeSessionExpired,
    handleMicrosoftLogin,
  } = useLogin();

  return (
    <Card className="shadow-lg">
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>
          <p className="mt-2 text-gray-600">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {error && (
          <Alert variant="error" className="mb-6" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <LoginForm 
          form={form} 
          onSubmit={onSubmit} 
          isLoading={isLoading} 
          onMicrosoftLogin={handleMicrosoftLogin} 
        />
      </CardContent>

      <SessionExpiredModal 
        isOpen={sessionExpired} 
        onAcknowledge={handleAcknowledgeSessionExpired} 
      />
    </Card>
  );
}
