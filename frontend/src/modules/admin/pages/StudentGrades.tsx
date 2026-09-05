import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/shared/lib/axios';
import { Button, Spinner } from '@/shared/components/ui';
import { ArrowLeft, Plus } from 'lucide-react';
import { AddGradeModal } from '../components/grades/AddGradeModal';
import { gradesApi } from '@/modules/teacher/api/grades.api';
import type { User, FlattenedGrade } from '@/modules/admin/types/user.types';

export default function StudentGrades() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);

  // Obtener información del usuario
  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['admin-user', id],
    queryFn: async () => {
      const res = await api.get<User>(`/users/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  // Obtener notas del estudiante reales desde la API
  const { data: gradeData, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['admin-user-grades', id],
    queryFn: async () => {
      if (!id) return null;
      return gradesApi.getAllGradesForUser(Number(id));
    },
    enabled: !!id
  });

  // Aplanar los datos para la tabla
  const flattenedGrades: FlattenedGrade[] = [];
  if (gradeData && gradeData.periods) {
    gradeData.periods.forEach(period => {
      period.courses.forEach(course => {
        flattenedGrades.push({
          periodName: period.periodName,
          courseCode: course.courseCode || course.courseShortname,
          courseName: course.courseSubjectName || course.courseName,
          grade: course.totalGrade !== null ? course.totalGrade : course.sumGrade,
          eq: '-', // Faltaría el cálculo de la letra de la calificación si se requiere
          isConvalidated: false, // Puedes ajustarlo si viene en los datos
          comments: course.comment
        });
      });
    });
  }

  if (isLoadingUser || isLoadingGrades) {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/admin/users/${id}`)} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calificaciones: {user.displayName}</h1>
            <p className="text-gray-500">Historial académico del estudiante</p>
          </div>
        </div>
        
        <Button onClick={() => setShowAddModal(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" />
          Agregar notas
        </Button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Ciclo</th>
                <th className="px-6 py-4">Codigo</th>
                <th className="px-6 py-4">Materia</th>
                <th className="px-6 py-4">Nota</th>
                <th className="px-6 py-4">EQ</th>
                <th className="px-6 py-4">CV</th>
                <th className="px-6 py-4">Comentario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flattenedGrades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay calificaciones registradas para este estudiante.
                  </td>
                </tr>
              ) : (
                flattenedGrades.map((grade, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 text-gray-900">{grade.periodName || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{grade.courseCode || '-'}</td>
                    <td className="px-6 py-4 text-gray-900">{grade.courseName || '-'}</td>
                    <td className="px-6 py-4 font-medium">{grade.grade !== null ? grade.grade : '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{grade.eq || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{grade.isConvalidated ? 'Sí' : 'No'}</td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{grade.comments || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddGradeModal 
          user={user} 
          onClose={() => setShowAddModal(false)} 
        />
      )}
    </div>
  );
}
