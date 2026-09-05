import { useAdminTranscripts } from '../hooks/useAdminTranscripts';
import { TranscriptsHeader } from '../components/transcripts/TranscriptsHeader';
import { TranscriptsStats } from '../components/transcripts/TranscriptsStats';
import { TranscriptsFilters } from '../components/transcripts/TranscriptsFilters';
import { TranscriptsTable } from '../components/transcripts/TranscriptsTable';
import { GenerateTranscriptModal } from '../components/transcripts/GenerateTranscriptModal';
import { RevokeTranscriptModal } from '../components/transcripts/RevokeTranscriptModal';

export default function AdminTranscripts() {
  const hookState = useAdminTranscripts();

  return (
    <div>
      <TranscriptsHeader onGenerateClick={() => hookState.setShowGenerateModal(true)} />
      
      <TranscriptsStats
        transcripts={hookState.data?.transcripts}
        total={hookState.data?.total}
      />
      
      <TranscriptsFilters
        search={hookState.search}
        setSearch={hookState.setSearch}
        statusFilter={hookState.statusFilter}
        setStatusFilter={hookState.setStatusFilter}
        setPage={hookState.setPage}
      />
      
      <TranscriptsTable
        isLoading={hookState.isLoading}
        transcripts={hookState.data?.transcripts}
        total={hookState.data?.total}
        page={hookState.page}
        limit={hookState.limit}
        totalPages={hookState.totalPages}
        setPage={hookState.setPage}
        onDownload={hookState.handleDownload}
        onRevoke={(transcript) => {
          hookState.setSelectedTranscript(transcript);
          hookState.setShowRevokeModal(true);
        }}
      />

      <GenerateTranscriptModal
        isOpen={hookState.showGenerateModal}
        onClose={() => hookState.setShowGenerateModal(false)}
        students={hookState.students}
        periods={hookState.periods}
        generateForm={hookState.generateForm}
        setGenerateForm={hookState.setGenerateForm}
        handleGenerate={hookState.handleGenerate}
        generateMutation={hookState.generateMutation}
      />

      <RevokeTranscriptModal
        isOpen={hookState.showRevokeModal}
        onClose={() => {
          hookState.setShowRevokeModal(false);
          hookState.setSelectedTranscript(null);
          hookState.setRevokeReason('');
        }}
        selectedTranscript={hookState.selectedTranscript}
        revokeReason={hookState.revokeReason}
        setRevokeReason={hookState.setRevokeReason}
        handleRevoke={hookState.handleRevoke}
        revokeMutation={hookState.revokeMutation}
      />
    </div>
  );
}
