import { useAdminReEnrolments } from '../hooks/useAdminReEnrolments';
import { ReEnrolmentsHeader } from '../components/reenrolments/ReEnrolmentsHeader';
import { ReEnrolmentsStats } from '../components/reenrolments/ReEnrolmentsStats';
import { ReEnrolmentsFilters } from '../components/reenrolments/ReEnrolmentsFilters';
import { ReEnrolmentList } from '../components/reenrolments/ReEnrolmentList';
import { ReEnrolmentDetail } from '../components/reenrolments/ReEnrolmentDetail';
import { RejectModal } from '../components/reenrolments/RejectModal';
import { EditCoursesModal } from '../components/reenrolments/EditCoursesModal';
import type { UseMutationResult } from '@tanstack/react-query';

export default function AdminReEnrolments() {
  const hookState = useAdminReEnrolments();

  if (hookState.viewMode === 'detail' && hookState.selectedRequest) {
    return (
      <div>
        <ReEnrolmentDetail
          selectedRequest={hookState.selectedRequest}
          backToList={hookState.backToList}
          setEditCoursesModalOpen={hookState.setEditCoursesModalOpen}
          approveMutation={hookState.approveMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
          applyMutation={hookState.applyMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
          openRejectModal={hookState.openRejectModal}
          rejectMutation={hookState.rejectMutation}
          deleteMutation={hookState.deleteMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
        />
        <RejectModal
          rejectModalOpen={hookState.rejectModalOpen}
          setRejectModalOpen={hookState.setRejectModalOpen}
          rejectReason={hookState.rejectReason}
          setRejectReason={hookState.setRejectReason}
          handleReject={hookState.handleReject}
          isPending={hookState.rejectMutation.isPending}
        />
        <EditCoursesModal
          editCoursesModalOpen={hookState.editCoursesModalOpen}
          setEditCoursesModalOpen={hookState.setEditCoursesModalOpen}
          selectedRequest={hookState.selectedRequest}
          availableCourses={hookState.availableCourses || []}
          adminRemoveCoursesMutation={hookState.adminRemoveCoursesMutation as unknown as UseMutationResult<unknown, Error, { id: number; courseMoodleIds: number[] }, unknown>}
          adminAddCoursesMutation={hookState.adminAddCoursesMutation as unknown as UseMutationResult<unknown, Error, { id: number; courses: { courseMoodleId: number }[] }, unknown>}
        />
      </div>
    );
  }

  return (
    <div>
      <ReEnrolmentsHeader />
      <ReEnrolmentsStats stats={hookState.stats} />
      <ReEnrolmentsFilters
        search={hookState.search}
        setSearch={hookState.setSearch}
        statusFilter={hookState.statusFilter}
        setStatusFilter={hookState.setStatusFilter}
        periodFilter={hookState.periodFilter}
        setPeriodFilter={hookState.setPeriodFilter}
        periods={hookState.periods}
      />
      <ReEnrolmentList
        isLoading={hookState.isLoading}
        requests={hookState.requests}
        statusFilter={hookState.statusFilter}
        viewDetail={hookState.viewDetail}
        approveMutation={hookState.approveMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
          applyMutation={hookState.applyMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
        openRejectModal={hookState.openRejectModal}
        rejectMutation={hookState.rejectMutation}
      />
      <RejectModal
        rejectModalOpen={hookState.rejectModalOpen}
        setRejectModalOpen={hookState.setRejectModalOpen}
        rejectReason={hookState.rejectReason}
        setRejectReason={hookState.setRejectReason}
        handleReject={hookState.handleReject}
        isPending={hookState.rejectMutation.isPending}
      />
    </div>
  );
}
