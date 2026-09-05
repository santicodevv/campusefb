import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, downloadBlob } from '@/shared/lib';
import toast from 'react-hot-toast';

export interface ApiError {
  response?: {
    data?: {
      message?: string | string[];
      error?: string | string[];
    };
  };
}

export interface Transcript {
  id: number;
  studentId: number;
  student?: {
    id: number;
    email: string;
    displayName: string;
  };
  periodId?: number;
  period?: {
    id: number;
    code: string;
    name: string;
  };
  transcriptNumber: string;
  fileHash: string;
  status: 'generated' | 'revoked';
  generatedAt: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface Student {
  id: number;
  email: string;
  displayName: string;
}

export interface Period {
  id: number;
  code: string;
  name: string;
}

export function useAdminTranscripts() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [generateForm, setGenerateForm] = useState({
    studentId: '',
    periodId: '',
  });
  const limit = 20;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transcripts', page, search, statusFilter],
    queryFn: async () => {
      const response = await api.get<Transcript[]>('/transcripts', {
        params: {
          status: statusFilter || undefined,
          studentId: search || undefined,
        },
      });
      return {
        transcripts: response.data,
        total: response.data.length,
      };
    },
  });

  const { data: students } = useQuery({
    queryKey: ['students-list'],
    queryFn: async () => {
      const response = await api.get<{ users: Student[] }>('/users', {
        params: { role: 'STUDENT', limit: 500 },
      });
      return response.data.users;
    },
    enabled: showGenerateModal,
  });

  const { data: periods } = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const response = await api.get<Period[]>('/periods');
      return response.data;
    },
    enabled: showGenerateModal,
  });

  const generateMutation = useMutation({
    mutationFn: async (mutationData: { studentId: number; periodId?: number }) => {
      const response = await api.post('/transcripts', mutationData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Constancia generada exitosamente');
      setShowGenerateModal(false);
      setGenerateForm({ studentId: '', periodId: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-transcripts'] });
    },
    onError: () => toast.error('Error al generar la constancia'),
  });

  const revokeMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await api.patch(`/transcripts/${id}/revoke`, { reason });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Constancia revocada');
      setShowRevokeModal(false);
      setSelectedTranscript(null);
      setRevokeReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-transcripts'] });
    },
    onError: () => toast.error('Error al revocar la constancia'),
  });

  const handleDownload = async (transcript: Transcript) => {
    try {
      const response = await api.get(`/transcripts/${transcript.id}/download`, {
        responseType: 'blob',
      });
      downloadBlob(response.data, `${transcript.transcriptNumber}.pdf`);
      toast.success('Constancia descargada');
    } catch {
      toast.error('Error al descargar la constancia');
    }
  };

  const handleGenerate = () => {
    if (!generateForm.studentId) {
      toast.error('Selecciona un estudiante');
      return;
    }
    generateMutation.mutate({
      studentId: parseInt(generateForm.studentId),
      periodId: generateForm.periodId ? parseInt(generateForm.periodId) : undefined,
    });
  };

  const handleRevoke = () => {
    if (!selectedTranscript || !revokeReason.trim()) {
      toast.error('Ingresa el motivo de revocación');
      return;
    }
    revokeMutation.mutate({ id: selectedTranscript.id, reason: revokeReason });
  };

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  return {
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    showGenerateModal,
    setShowGenerateModal,
    showRevokeModal,
    setShowRevokeModal,
    selectedTranscript,
    setSelectedTranscript,
    revokeReason,
    setRevokeReason,
    generateForm,
    setGenerateForm,
    limit,
    data,
    isLoading,
    students,
    periods,
    generateMutation,
    revokeMutation,
    handleDownload,
    handleGenerate,
    handleRevoke,
    totalPages,
  };
}
