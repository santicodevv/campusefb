export function SSOLoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 font-sans bg-slate-50">
      <svg
        className="w-12 h-12 text-blue-500 animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <p className="text-slate-600 text-base">Iniciando sesión con tu cuenta institucional…</p>
    </div>
  );
}
