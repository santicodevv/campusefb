import { useAdminPeriods } from '../hooks/useAdminPeriods';
import { PeriodsHeader } from '../components/periods/PeriodsHeader';
import { PeriodCreateForm } from '../components/periods/PeriodCreateForm';
import { PeriodListView } from '../components/periods/PeriodListView';
import { PeriodDetailView } from '../components/periods/PeriodDetailView';
import { PeriodCoursesView } from '../components/periods/PeriodCoursesView';
import { PeriodEditModal } from '../components/periods/PeriodEditModal';
import type { UseMutationResult } from '@tanstack/react-query';

export default function AdminPeriods() {
  const {
    viewMode,
    setViewMode,
    selectedPeriod,
    setSelectedPeriod,
    showCreateForm,
    setShowCreateForm,
    showReenrolmentConfig,
    setShowReenrolmentConfig,
    courseSearch,
    setCourseSearch,
    showEditForm,
    setShowEditForm,
    editPeriodData,
    setEditPeriodData,
    newPeriod,
    setNewPeriod,
    reenrolmentConfig,
    setReenrolmentConfig,
    selectedCoursesToAdd,
    setSelectedCoursesToAdd,
    periods,
    loadingPeriods,
    availableCourses,
    loadingAvailableCourses,
    loadingMoodleCourses,
    createMutation,
    configReenrolmentMutation,
    openReenrolmentMutation,
    closeReenrolmentMutation,
    openPeriodMutation,
    closePeriodMutation,
    addCoursesMutation,
    removeCoursesMutation,
    toggleCourseMutation,
    updatePeriodMutation,
    deletePeriodMutation,
    handleSelectPeriod,
    handleAddCourses,
    coursesToShow,
  } = useAdminPeriods();

  return (
    <div>
      <PeriodsHeader
        viewMode={viewMode}
        showCreateForm={showCreateForm}
        setShowCreateForm={setShowCreateForm}
      />

      {showCreateForm && viewMode === 'list' && (
        <PeriodCreateForm
          newPeriod={newPeriod}
          setNewPeriod={setNewPeriod}
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate(newPeriod);
          }}
          isPending={createMutation.isPending}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {viewMode === 'list' && (
        <PeriodListView
          periods={periods}
          loadingPeriods={loadingPeriods}
          handleSelectPeriod={handleSelectPeriod}
          setShowCreateForm={setShowCreateForm}
        />
      )}

      {viewMode === 'detail' && selectedPeriod && (
        <PeriodDetailView
          selectedPeriod={selectedPeriod}
          setViewMode={setViewMode}
          setSelectedPeriod={setSelectedPeriod}
          openPeriodMutation={openPeriodMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
          closePeriodMutation={closePeriodMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
          deletePeriodMutation={deletePeriodMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
          setEditPeriodData={setEditPeriodData}
          setShowEditForm={setShowEditForm}
          showReenrolmentConfig={showReenrolmentConfig}
          setShowReenrolmentConfig={setShowReenrolmentConfig}
          reenrolmentConfig={reenrolmentConfig}
          setReenrolmentConfig={setReenrolmentConfig}
          configReenrolmentMutation={configReenrolmentMutation as unknown as UseMutationResult<unknown, Error, { id: number; data: { reenrolmentStartDate: string; reenrolmentEndDate: string } }, unknown>}
          openReenrolmentMutation={openReenrolmentMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
          closeReenrolmentMutation={closeReenrolmentMutation as unknown as UseMutationResult<unknown, Error, number, unknown>}
        />
      )}

      {viewMode === 'courses' && selectedPeriod && (
        <PeriodCoursesView
          selectedPeriod={selectedPeriod}
          setViewMode={setViewMode}
          loadingAvailableCourses={loadingAvailableCourses}
          availableCourses={availableCourses}
          toggleCourseMutation={toggleCourseMutation as unknown as UseMutationResult<unknown, Error, { periodId: number; courseMoodleId: number; enabled: boolean }, unknown>}
          removeCoursesMutation={removeCoursesMutation as unknown as UseMutationResult<unknown, Error, { periodId: number; courseMoodleIds: number[] }, unknown>}
          courseSearch={courseSearch}
          setCourseSearch={setCourseSearch}
          loadingMoodleCourses={loadingMoodleCourses}
          coursesToShow={coursesToShow}
          selectedCoursesToAdd={selectedCoursesToAdd}
          setSelectedCoursesToAdd={setSelectedCoursesToAdd}
          handleAddCourses={handleAddCourses}
          addCoursesMutation={addCoursesMutation as unknown as UseMutationResult<unknown, Error, { periodId: number; courses: { courseMoodleId: number; courseName?: string; courseShortname?: string; categoryMoodleId?: number }[] }, unknown>}
        />
      )}

      <PeriodEditModal
        showEditForm={showEditForm}
        setShowEditForm={setShowEditForm}
        editPeriodData={editPeriodData}
        setEditPeriodData={setEditPeriodData}
        updatePeriodMutation={updatePeriodMutation as unknown as UseMutationResult<unknown, Error, { id: number; data: { id: number; code: string; name: string; startDate: string; endDate: string; description: string } }, unknown>}
      />
    </div>
  );
}
