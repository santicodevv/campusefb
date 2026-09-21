import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Spinner } from '@/shared/components/ui';
import { FileText } from 'lucide-react';
import { DocumentRow } from './DocumentRow';
import { uploadsApi } from '@/shared/api/uploads.api';
import { DocumentType, UserDocument } from '@/shared/types/document.types';

interface DocumentsSectionProps {
  userId?: number;
  readOnly?: boolean;
}

export function DocumentsSection({ userId, readOnly = false }: DocumentsSectionProps) {
  const { data: documents, isLoading, refetch } = useQuery({
    queryKey: ['user-documents', userId],
    queryFn: () => userId
      ? uploadsApi.getUserDocuments(userId)
      : uploadsApi.getMyDocuments(),
  });

  const getDocumentByType = (type: DocumentType): UserDocument | undefined => {
    return documents?.find(doc => doc.documentType === type);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-8">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-violet-600" />
          Documentos
        </CardTitle>
        <CardDescription>
          {readOnly
            ? 'Documentos cargados por el estudiante'
            : 'Sube tus documentos requeridos (PDF, JPG o PNG, máx. 5MB)'}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {Object.values(DocumentType).map((type) => (
          <DocumentRow
            key={type}
            documentType={type}
            document={getDocumentByType(type)}
            onDocumentUpdate={refetch}
            readOnly={readOnly}
          />
        ))}
      </CardContent>
    </Card>
  );
}
