import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';
import { Card, CardContent, Spinner, Button } from '@/shared/components/ui';
import { ArrowLeft, ExternalLink, GraduationCap, FileText, UserCog, User, Church, Briefcase } from 'lucide-react';
import { formatDate } from '@/shared/lib/utils';
import { DocumentsSection } from '@/shared/components/profile/DocumentsSection';
import type { User as UserType } from '@/modules/admin/types/user.types';

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: user, isLoading } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const res = await api.get<UserType>(`/users/${id}`);
      return res.data;
    },
  });

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[400px]"><Spinner /></div>;
  }

  if (!user) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-500">Usuario no encontrado</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/users')}>Volver</Button>
      </div>
    );
  }

  // Dividir el displayName en Nombre y Apellido (muy basico)
  const nameParts = user.displayName.split(' ');
  const nombre = nameParts[0] || '';
  const apellido = nameParts.slice(1).join(' ') || '';

  const photoUrl = user.profilePhotoUrl ? `${backendUrl}/${user.profilePhotoUrl}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin/users')} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Datos del Usuario</h1>
            <p className="text-gray-500">Perfil del estudiante</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.open(`${import.meta.env.VITE_MOODLE_URL || ''}/user/view.php?id=${user.moodleUserId || ''}`, '_blank')}
            disabled={!user.moodleUserId}
            className="flex items-center text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Perfil
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/settings/estudiantes/${user.id}/editar`)}
            className="flex items-center text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
          >
            <UserCog className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
          <Button
            onClick={() => navigate(`/admin/users/${user.id}/grades`)}
            className="bg-violet-600 hover:bg-violet-700"
          >
            <FileText className="h-4 w-4 mr-2" />
            Calificaciones
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="h-20 w-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Foto de perfil"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{user.displayName}</h2>
                <p className="text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-700 col-span-1">USUARIO:</span>
                <span className="text-gray-900 col-span-2">{user.username || user.email.split('@')[0]}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-700 col-span-1">NOMBRE:</span>
                <span className="text-gray-900 col-span-2">{nombre}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-700 col-span-1">APELLIDO:</span>
                <span className="text-gray-900 col-span-2">{apellido}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-700 col-span-1">CORREO:</span>
                <span className="text-gray-900 col-span-2">{user.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-700 col-span-1 flex items-center gap-1">
                  <Church className="h-4 w-4" /> IGLESIA:
                </span>
                <span className="text-gray-900 col-span-2">
                  {user.church || <span className="text-gray-400 italic">No especificada</span>}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-b border-gray-100 pb-3">
                <span className="font-semibold text-gray-700 col-span-1 flex items-center gap-1">
                  <Briefcase className="h-4 w-4" /> PROFESIÓN:
                </span>
                <span className="text-gray-900 col-span-2">
                  {user.profession || <span className="text-gray-400 italic">No especificada</span>}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="font-semibold text-gray-700 col-span-1">ULTIMA CONEXIÓN:</span>
                <span className="text-gray-900 col-span-2">
                  {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Nunca'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-violet-600" />
              Cursos Actuales
            </h3>
            <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">Este estudiante no tiene cursos asignados actualmente.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DocumentsSection userId={user.id} readOnly />
    </div>
  );
}
