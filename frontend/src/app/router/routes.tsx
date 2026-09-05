// Route configuration
import { lazy } from 'react';
import type { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { GuestRoute } from './GuestRoute';
import { MainLayout } from '@/shared/components/layout';
import { AuthLayout } from '@/shared/components/layout';

// Lazy load pages for code splitting
// Auth pages
const LoginPage = lazy(() => import('@/modules/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/modules/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const SSOCallbackPage = lazy(() => import('@/modules/auth/pages/SSOCallbackPage').then(m => ({ default: m.SSOCallbackPage })));

// Student pages
const StudentDashboard = lazy(() => import('@/modules/student/pages/Dashboard'));
const StudentGrades = lazy(() => import('@/modules/student/pages/Grades'));
const StudentCourses = lazy(() => import('@/modules/student/pages/Courses'));
const StudentReEnrolment = lazy(() => import('@/modules/student/pages/ReEnrolment'));
const StudentPayments = lazy(() => import('@/modules/student/pages/Payments'));
// const StudentTranscripts = lazy(() => import('@/modules/student/pages/Transcripts'));

// Teacher pages
const TeacherDashboard = lazy(() => import('@/modules/teacher/pages/Dashboard'));
const TeacherCourses = lazy(() => import('@/modules/teacher/pages/Courses'));
const TeacherGradeEntry = lazy(() => import('@/modules/teacher/pages/GradeEntry'));
const TeacherGrades = lazy(() => import('@/modules/teacher/pages/TeacherGrades'));

// Admin pages
const AdminDashboard = lazy(() => import('@/modules/admin/pages/Dashboard'));
const AdminUsers = lazy(() => import('@/modules/admin/pages/Users'));
const AdminStudentProfile = lazy(() => import('@/modules/admin/pages/StudentProfile'));
const AdminStudentGrades = lazy(() => import('@/modules/admin/pages/StudentGrades'));

const AdminCourses = lazy(() => import('@/modules/admin/pages/Courses'));
const AdminCourseDetail = lazy(() => import('@/modules/admin/pages/CourseDetail'));
const AdminGrades = lazy(() => import('@/modules/admin/pages/Grades'));
const AdminUserGrades = lazy(() => import('@/modules/admin/pages/UserGrades'));
const AdminGradeRecord = lazy(() => import('@/modules/admin/pages/GradeRecord'));
const AdminGradesSummary = lazy(() => import('@/modules/admin/pages/GradesSummary'));
const AdminPeriods = lazy(() => import('@/modules/admin/pages/Periods'));
const AdminReEnrolments = lazy(() => import('@/modules/admin/pages/ReEnrolments'));
// const AdminTranscripts = lazy(() => import('@/modules/admin/pages/Transcripts'));
const AdminPayments = lazy(() => import('@/modules/admin/pages/Payments'));
const AdminAcademicProjection = lazy(() => import('@/modules/admin/pages/AcademicProjection'));
const AdminSync = lazy(() => import('@/modules/admin/pages/Sync'));
const AdminAudit = lazy(() => import('@/modules/admin/pages/Audit'));
const AdminCreateCourse = lazy(() => import('@/modules/admin/pages/CreateCourse'));

// Admin Settings pages
const AdminSettingsProfesores = lazy(() => import('@/modules/admin/pages/settings/Profesores'));
const AdminSettingsNuevoProfesor = lazy(() => import('@/modules/admin/pages/settings/NuevoProfesor'));
const AdminSettingsEditarProfesor = lazy(() => import('@/modules/admin/pages/settings/EditarProfesor'));
const AdminSettingsEstudiantes = lazy(() => import('@/modules/admin/pages/settings/Estudiantes'));
const AdminSettingsNuevoEstudiante = lazy(() => import('@/modules/admin/pages/settings/NuevoEstudiante'));
const AdminSettingsEditarEstudiante = lazy(() => import('@/modules/admin/pages/settings/EditarEstudiante'));

const AdminSettingsUsuarios = lazy(() => import('@/modules/admin/pages/settings/Usuarios'));
const AdminSettingsNuevoUsuario = lazy(() => import('@/modules/admin/pages/settings/NuevoUsuario'));
const AdminSettingsEditarUsuario = lazy(() => import('@/modules/admin/pages/settings/EditarUsuario'));

// Shared pages
const ProfilePage = lazy(() => import('@/shared/pages/Profile'));
const NotFoundPage = lazy(() => import('@/shared/pages/NotFound'));

export const routes: RouteObject[] = [
  // Guest routes (login, register) with AuthLayout
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { index: true, path: '/', element: <LoginPage /> },
        ],
      },
    ],
  },

  // Protected routes (require authentication) with MainLayout
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          // Shared routes (all authenticated users)
          { path: '/profile', element: <ProfilePage /> },

          // Student routes
          {
            path: '/student',
            element: <RoleGuard allowedRoles={['STUDENT', 'ADMIN']} />,
            children: [
              { index: true, element: <StudentDashboard /> },
              { path: 'grades', element: <StudentGrades /> },
              { path: 'courses', element: <StudentCourses /> },
              { path: 'reenrolment', element: <StudentReEnrolment /> },
              { path: 'payments', element: <StudentPayments /> },
              // { path: 'transcripts', element: <StudentTranscripts /> }, // Temporalmente oculto
            ],
          },

          // Teacher routes
          {
            path: '/teacher',
            element: <RoleGuard allowedRoles={['TEACHER', 'ADMIN']} />,
            children: [
              { index: true, element: <TeacherDashboard /> },
              { path: 'courses', element: <TeacherCourses /> },
              {
                path: 'courses/:courseId/grades',
                element: <TeacherGradeEntry />,
              },
              {
                path: 'courses/:courseId/grades/:itemId',
                element: <TeacherGradeEntry />,
              },
              { path: 'grades/:courseId', element: <TeacherGrades /> },
            ],
          },

          // Admin routes
          {
            path: '/admin',
            element: <RoleGuard allowedRoles={['ADMIN']} />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'users', element: <AdminUsers /> },
              { path: 'users/:id', element: <AdminStudentProfile /> },
              { path: 'users/:id/grades', element: <AdminStudentGrades /> },
              { path: 'courses', element: <AdminCourses /> },
              { path: 'courses/create', element: <AdminCreateCourse /> },
              { path: 'courses/:courseId', element: <AdminCourseDetail /> },
              { path: 'grades', element: <AdminGrades /> },
              { path: 'grades/user', element: <AdminUserGrades /> },
              { path: 'grades/record', element: <AdminGradeRecord /> },
              { path: 'grades/summary', element: <AdminGradesSummary /> },
              { path: 'periods', element: <AdminPeriods /> },
              { path: 'reenrolments', element: <AdminReEnrolments /> },
              // { path: 'transcripts', element: <AdminTranscripts /> }, // Temporalmente oculto
              { path: 'payments', element: <AdminPayments /> },
              { path: 'academic-projection', element: <AdminAcademicProjection /> },
              { path: 'sync', element: <AdminSync /> },
              { path: 'audit', element: <AdminAudit /> },
              // Settings routes
              { path: 'settings/profesores', element: <AdminSettingsProfesores /> },
              { path: 'settings/profesores/nuevo', element: <AdminSettingsNuevoProfesor /> },
              { path: 'settings/profesores/:id/editar', element: <AdminSettingsEditarProfesor /> },
              { path: 'settings/estudiantes', element: <AdminSettingsEstudiantes /> },
              { path: 'settings/estudiantes/nuevo', element: <AdminSettingsNuevoEstudiante /> },
              { path: 'settings/estudiantes/:id/editar', element: <AdminSettingsEditarEstudiante /> },

              { path: 'settings/usuarios', element: <AdminSettingsUsuarios /> },
              { path: 'settings/usuarios/nuevo', element: <AdminSettingsNuevoUsuario /> },
              { path: 'settings/usuarios/:id/editar', element: <AdminSettingsEditarUsuario /> },
            ],
          },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <NotFoundPage /> },

  // SSO Callback — ruta pública especial, fuera de Guest/Protected guards
  // El backend redirige aquí tras el login con Microsoft con el token en la URL
  { path: '/auth/callback', element: <SSOCallbackPage /> },
];

export default routes;
