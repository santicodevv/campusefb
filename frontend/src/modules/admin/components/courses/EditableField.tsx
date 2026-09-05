import { Pencil, Check, X } from 'lucide-react';
import { Input } from '@/shared/components/ui';

interface EditableFieldProps {
  label: string;
  value: string | undefined | null;
  placeholder: string;
  isEditing: boolean;
  editValue: string;
  onEditValueChange: (val: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  valueClassName?: string;
}

export function EditableField({
  label,
  value,
  placeholder,
  isEditing,
  editValue,
  onEditValueChange,
  onStartEdit,
  onSave,
  onCancel,
  valueClassName = "font-medium text-sm"
}: EditableFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 uppercase">{label}</p>
        {!isEditing && (
          <button
            onClick={onStartEdit}
            className="text-blue-600 hover:text-blue-700"
          >
            <Pencil className="h-3 w-3" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="flex items-center gap-1 mt-1">
          <Input
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            placeholder={placeholder}
            className="h-8 text-sm"
          />
          <button
            onClick={onSave}
            className="p-1 text-green-600 hover:text-green-700"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={onCancel}
            className="p-1 text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <p className={valueClassName}>
          {value || <span className="text-gray-400 italic">Sin asignar</span>}
        </p>
      )}
    </div>
  );
}
