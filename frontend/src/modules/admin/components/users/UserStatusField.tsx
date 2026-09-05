interface UserStatusFieldProps {
  isActive: boolean;
  onToggle: () => void;
}

export function UserStatusField({ isActive, onToggle }: UserStatusFieldProps) {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium text-gray-700">Usuario activo</label>
      <button
        type="button"
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          isActive ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            isActive ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
