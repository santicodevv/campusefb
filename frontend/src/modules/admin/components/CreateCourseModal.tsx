import { Modal, ModalFooter, Button, Alert, Spinner } from '@/shared/components/ui';
import { BookOpen } from 'lucide-react';
import { useCreateCourse } from '../hooks/useCreateCourse';
import { CourseCategoryField } from './courses/CourseCategoryField';
import { CourseTeachersField } from './courses/CourseTeachersField';
import { CourseBasicInfoFields } from './courses/CourseBasicInfoFields';
import { CoursePeriodField } from './courses/CoursePeriodField';
import { CourseVisibilityField } from './courses/CourseVisibilityField';
import { CourseDateFields } from './courses/CourseDateFields';
import { CourseOptionalInfoFields } from './courses/CourseOptionalInfoFields';

interface CreateCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CreateCourseModal(props: CreateCourseModalProps) {
  const {
    error,
    formData,
    setFormData,
    enableEndDate,
    setEnableEndDate,
    selectedTeacherIds,
    setSelectedTeacherIds,
    categories,
    categoriesLoading,
    periods,
    periodsLoading,
    teachers,
    teachersLoading,
    syncCategoriesMutation,
    createCourseMutation,
    handleClose,
    handleSubmit,
    handleInputChange,
  } = useCreateCourse(props);

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={handleClose}
      title="Crear Nuevo Curso"
      description="Crea un curso en Moodle y en el sistema local"
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <Alert variant="error" className="mb-4">
            {error}
          </Alert>
        )}

        <div className="space-y-4">
          <CourseBasicInfoFields 
            formData={formData} 
            handleInputChange={handleInputChange} 
          />

          <CourseCategoryField 
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoryId={formData.categoryid}
            handleInputChange={handleInputChange}
            syncCategoriesMutation={syncCategoriesMutation}
          />

          <CoursePeriodField 
            periods={periods}
            periodsLoading={periodsLoading}
            formData={formData}
            setFormData={setFormData}
          />

          <CourseTeachersField 
            teachers={teachers}
            teachersLoading={teachersLoading}
            selectedTeacherIds={selectedTeacherIds}
            setSelectedTeacherIds={setSelectedTeacherIds}
          />

          <CourseVisibilityField 
            formData={formData} 
            setFormData={setFormData} 
          />

          <CourseDateFields 
            formData={formData}
            handleInputChange={handleInputChange}
            enableEndDate={enableEndDate}
            setEnableEndDate={setEnableEndDate}
          />

          <CourseOptionalInfoFields 
            formData={formData}
            handleInputChange={handleInputChange}
          />
        </div>

        <ModalFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createCourseMutation.isPending}>
            {createCourseMutation.isPending ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Creando...
              </>
            ) : (
              <>
                <BookOpen className="h-4 w-4 mr-2" />
                Crear Curso
              </>
            )}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

export default CreateCourseModal;
