import { useState } from 'react';
import { useAuth } from '@/app/providers';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '@/shared/components/ui';
import { User, Mail, Shield, LogOut, ArrowLeft, Pencil } from 'lucide-react';
import { EditProfileModal } from '@/shared/components/profile/EditProfileModal';
import { getRoleLabel } from '@/shared/lib/utils';

export default function ProfilePage() {
  const { user, logout, roles } = useAuth();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const defaultRoute = roles.includes('ADMIN')
    ? '/admin'
    : roles.includes('TEACHER')
      ? '/teacher'
      : '/student';

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'TEACHER':
        return 'primary';
      case 'STUDENT':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate(defaultRoute)}
          className="flex items-center gap-2 w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Tu información de cuenta en el sistema
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {user?.displayName}
              </h2>
              <div className="flex gap-2 mt-1">
                {roles.map((role) => (
                  <Badge key={role} variant={getRoleBadgeVariant(role)}>
                    {getRoleLabel(role)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Correo electrónico</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Estado de cuenta</p>
                <p className="font-medium text-gray-900">
                  {user?.isActive ? (
                    <Badge variant="success">Activa</Badge>
                  ) : (
                    <Badge variant="danger">Inactiva</Badge>
                  )}
                </p>
              </div>
            </div>

            {user?.moodleUserId && (
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">ID de Moodle</p>
                  <p className="font-medium text-gray-900">{user.moodleUserId}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            leftIcon={<Pencil className="h-4 w-4" />}
            onClick={() => setIsEditModalOpen(true)}
          >
            Editar perfil
          </Button>
          <Button variant="danger" leftIcon={<LogOut className="h-4 w-4" />} onClick={logout}>
            Cerrar sesión
          </Button>
        </CardFooter>
      </Card>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user}
      />
    </div>
  );
}
