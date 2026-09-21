import { useState } from 'react';
import { FileText, Download, Trash2, Eye, Upload, CheckCircle } from 'lucide-react';
import { Button, Spinner } from '@/shared/components/ui';
import { DocumentType, DOCUMENT_TYPE_LABELS, UserDocument } from '@/shared/types/document.types';
import { uploadsApi } from '@/shared/api/uploads.api';
import toast from 'react-hot-toast';

interface DocumentRowProps {
  documentType: DocumentType;
  document?: UserDocument;
  onDocumentUpdate: () => void;
  readOnly?: boolean;
}

export function DocumentRow({
  documentType,
  document,
  onDocumentUpdate,
  readOnly = false,
}: DocumentRowProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const documentUrl = document ? `${backendUrl}/${document.filePath}` : null;

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten archivos PDF, JPG o PNG');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo no puede ser mayor a 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await uploadsApi.uploadDocument(file, documentType);
      toast.success('Documento subido exitosamente');
      onDocumentUpdate();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al subir el documento';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    setIsDeleting(true);
    try {
      await uploadsApi.deleteDocument(document.id);
      toast.success('Documento eliminado');
      onDocumentUpdate();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar el documento';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleView = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleDownload = () => {
    if (documentUrl && document) {
      const link = window.document.createElement('a');
      link.href = documentUrl;
      link.download = document.originalFilename;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${document ? 'bg-green-100' : 'bg-gray-100'}`}>
          {document ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <FileText className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">
            {DOCUMENT_TYPE_LABELS[documentType]}
          </p>
          {document ? (
            <p className="text-sm text-gray-500">
              {document.originalFilename} ({formatFileSize(document.fileSize)})
            </p>
          ) : (
            <p className="text-sm text-gray-400">Sin documento</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(isUploading || isDeleting) && <Spinner size="sm" />}

        {document && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleView}
              disabled={isUploading || isDeleting}
              title="Ver documento"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={isUploading || isDeleting}
              title="Descargar documento"
            >
              <Download className="h-4 w-4" />
            </Button>
          </>
        )}

        {!readOnly && (
          <>
            <label className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isUploading || isDeleting}
              />
              <Upload className="h-4 w-4" />
              {document ? 'Reemplazar' : 'Subir'}
            </label>

            {document && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isUploading || isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                title="Eliminar documento"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
