import { Card, CardContent, Input, Button, Badge, Spinner } from '@/shared/components/ui';
import { Users, Search, GraduationCap, UserCheck } from 'lucide-react';
import type { EnrolledUserWithDetails } from '@/shared/types';
import { getAccessStatus } from '../../hooks/useCourseDetail';

interface CourseEnrolledUsersProps {
  enrolledUsers: EnrolledUserWithDetails[] | undefined;
  filteredUsers: EnrolledUserWithDetails[] | undefined;
  usersLoading: boolean;
  search: string;
  setSearch: (val: string) => void;
  roleFilter: 'all' | 'student' | 'teacher';
  setRoleFilter: (val: 'all' | 'student' | 'teacher') => void;
  studentsCount: number;
  teachersCount: number;
}

export function CourseEnrolledUsers({
  enrolledUsers,
  filteredUsers,
  usersLoading,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  studentsCount,
  teachersCount,
}: CourseEnrolledUsersProps) {
  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 inline mr-2" />
            Personas Inscritas ({enrolledUsers?.length || 0})
          </h3>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === 'all' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={roleFilter === 'student' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('student')}
            >
              <GraduationCap className="h-4 w-4 mr-1" />
              Estudiantes ({studentsCount})
            </Button>
            <Button
              variant={roleFilter === 'teacher' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setRoleFilter('teacher')}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Profesores ({teachersCount})
            </Button>
          </div>
        </div>

        {usersLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : filteredUsers && filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Último Acceso</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={`${user.moodleId}-${user.roleCode}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${
                            user.roleCode === 'student' ? 'bg-green-100' : 'bg-orange-100'
                          }`}
                        >
                          {user.roleCode === 'student' ? (
                            <GraduationCap className="h-4 w-4 text-green-600" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstname} {user.lastname}
                          </p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.roleCode === 'student' ? 'default' : 'secondary'}>
                        {user.roleCode === 'student'
                          ? 'Estudiante'
                          : user.roleCode === 'editingteacher'
                            ? 'Profesor Editor'
                            : 'Profesor'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {(() => {
                        const status = getAccessStatus(user.lastCourseAccess);
                        return (
                          <div className={`flex items-center justify-center gap-2 text-sm ${status.bgColor} rounded-lg px-2 py-1`}>
                            <span className={`w-3 h-3 rounded-full ${status.color}`} title={status.label} />
                            <span className="text-gray-700">
                              {user.lastCourseAccess
                                ? new Date(user.lastCourseAccess).toLocaleDateString('es-ES', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : 'Nunca'}
                            </span>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={user.enrolStatus === 'active' ? 'success' : 'secondary'}>
                        {user.enrolStatus === 'active' ? 'Activo' : 'Suspendido'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Users className="h-12 w-12 mb-4 text-gray-300" />
            <p>No hay personas inscritas</p>
            {search && <p className="text-sm">Intenta con otra b&uacute;squeda</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
