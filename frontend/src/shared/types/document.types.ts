export enum DocumentType {
  CEDULA = 'CEDULA',
  CERTIFICADO_BACHILLER = 'CERTIFICADO_BACHILLER',
  CARTA_PASTOR = 'CARTA_PASTOR',
}

export interface UserDocument {
  id: number;
  userId: number;
  documentType: DocumentType;
  originalFilename: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  [DocumentType.CEDULA]: 'Cédula de Identidad',
  [DocumentType.CERTIFICADO_BACHILLER]: 'Certificado de Bachiller',
  [DocumentType.CARTA_PASTOR]: 'Carta del Pastor',
};
