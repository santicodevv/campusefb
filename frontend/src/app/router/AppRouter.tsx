// App Router - Main router component
import { Suspense } from 'react';
import { useRoutes } from 'react-router-dom';
import { routes } from './routes';

// Loading fallback for lazy-loaded pages
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </div>
  );
}

export function AppRouter() {
  const element = useRoutes(routes);

  return (
    <Suspense fallback={<PageLoader />}>
      {element}
    </Suspense>
  );
}

export default AppRouter;
