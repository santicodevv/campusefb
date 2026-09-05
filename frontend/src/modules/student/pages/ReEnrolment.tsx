import { useStudentReEnrolment } from '../hooks/useStudentReEnrolment';
import { ReEnrolmentHeader } from '../components/reenrolment/ReEnrolmentHeader';
import { ReEnrolmentTabs } from '../components/reenrolment/ReEnrolmentTabs';
import { AvailablePeriodsList } from '../components/reenrolment/AvailablePeriodsList';
import { SelectCoursesView } from '../components/reenrolment/SelectCoursesView';
import { ReEnrolmentHistory } from '../components/reenrolment/ReEnrolmentHistory';

export default function StudentReEnrolment() {
  const state = useStudentReEnrolment();

  return (
    <div>
      <ReEnrolmentHeader />

      <ReEnrolmentTabs
        viewMode={state.viewMode}
        setViewMode={state.setViewMode}
        resetSelection={() => {
          state.setSelectedPeriod(null);
          state.setSelectedCourses([]);
        }}
      />

      {state.viewMode === 'periods' && (
        <AvailablePeriodsList
          loadingPeriods={state.loadingPeriods}
          openPeriods={state.openPeriods}
          myRequests={state.myRequests}
          handleSelectPeriod={state.handleSelectPeriod}
        />
      )}

      {state.viewMode === 'select-courses' && state.selectedPeriod && (
        <SelectCoursesView
          selectedPeriod={state.selectedPeriod}
          setViewMode={state.setViewMode}
          setSelectedPeriod={state.setSelectedPeriod}
          setSelectedCourses={state.setSelectedCourses}
          existingDraft={state.existingDraft}
          loadingCourses={state.loadingCourses}
          availableCourses={state.availableCourses}
          selectedCourses={state.selectedCourses}
          alreadyRequestedCourses={state.alreadyRequestedCourses}
          handleToggleCourse={state.handleToggleCourse}
          handleSaveDraft={state.handleSaveDraft}
          handleSubmit={state.handleSubmit}
          deleteMutation={state.deleteMutation}
          createMutation={state.createMutation}
          updateMutation={state.updateMutation}
          submitMutation={state.submitMutation}
        />
      )}

      {state.viewMode === 'history' && (
        <ReEnrolmentHistory
          loadingRequests={state.loadingRequests}
          myRequests={state.myRequests}
          openPeriods={state.openPeriods}
          handleSelectPeriod={state.handleSelectPeriod}
          submitMutation={state.submitMutation}
          setViewMode={state.setViewMode}
        />
      )}
    </div>
  );
}
