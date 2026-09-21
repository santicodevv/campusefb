import { useState, useRef } from 'react';
import { Camera, Trash2, User } from 'lucide-react';
import { Button, Spinner } from '@/shared/components/ui';
import { uploadsApi } from '@/shared/api/uploads.api';
import { useAuth } from '@/app/providers';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  currentPhotoUrl?: string | null;
  onPhotoUpdate?: () => void;
}

export function ProfilePhotoUpload({ currentPhotoUrl, onPhotoUpdate }: ProfilePhotoUploadProps) {
  const { refreshUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const photoUrl = currentPhotoUrl ? `${backendUrl}/${currentPhotoUrl}` : null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      toast.error('Solo se permiten archivos JPG o PNG');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadsApi.uploadProfilePhoto(file);
      await refreshUser();
      toast.success('Foto de perfil actualizada');
      onPhotoUpdate?.();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al subir la foto';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeletePhoto = async () => {
    if (!currentPhotoUrl) return;

    setIsDeleting(true);
    try {
      await uploadsApi.deleteProfilePhoto();
      await refreshUser();
      toast.success('Foto de perfil eliminada');
      onPhotoUpdate?.();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar la foto';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <div className="h-24 w-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Foto de perfil"
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-12 w-12 text-blue-600" />
          )}
          {(isUploading || isDeleting) && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <Spinner size="sm" />
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDeleting}
        >
          <Camera className="h-4 w-4 mr-1" />
          {currentPhotoUrl ? 'Cambiar' : 'Subir foto'}
        </Button>
        {currentPhotoUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeletePhoto}
            disabled={isUploading || isDeleting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
