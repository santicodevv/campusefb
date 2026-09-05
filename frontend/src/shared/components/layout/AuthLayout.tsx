// Auth Layout component - Wraps login/register pages
import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 text-white p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <GraduationCap className="h-10 w-10" />
            <span className="text-2xl font-bold">EFB</span>
          </div>
        </div>

        <div className="space-y-6 flex flex-col items-center relative top-[-45px]">
          <div className="mb-10">
            <img
              src="https://imgur.com/BfhxWQH.png"
              alt="Logo"
              className="w-[150px]"
            />
          </div>

          <div>
            <h1 className="text-4xl font-bold leading-tight text-center">
              Sistema de Gestión
              <br />
              Académica
            </h1>
            <p className="text-lg text-blue-100 max-w-md text-center">
              Escuela de Formación Bíblica, un espacio que te acerca más a tu comunidad educativa.
            </p>
          </div>
        </div>

        <div className="text-sm text-blue-200">
          &copy; {new Date().getFullYear()} EFB | Escuela de Formación Bíblica. Todos los derechos
          reservados.
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">EFB</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
