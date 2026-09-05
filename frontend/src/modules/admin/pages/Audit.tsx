import { useAdminAudit } from '../hooks/useAdminAudit';
import { AuditHeader } from '../components/audit/AuditHeader';
import { AuditFilters } from '../components/audit/AuditFilters';
import { AuditLogList } from '../components/audit/AuditLogList';

export default function AdminAudit() {
  const {
    search,
    setSearch,
    entityFilter,
    setEntityFilter,
    setPage,
    isLoading,
    entities,
    filteredLogs,
  } = useAdminAudit();

  return (
    <div>
      <AuditHeader />

      <AuditFilters 
        search={search}
        setSearch={setSearch}
        entityFilter={entityFilter}
        setEntityFilter={setEntityFilter}
        setPage={setPage}
        entities={entities}
        filteredCount={filteredLogs?.length || 0}
      />

      <AuditLogList 
        logs={filteredLogs}
        isLoading={isLoading}
        search={search}
        entityFilter={entityFilter}
        setPage={setPage}
      />
    </div>
  );
}
