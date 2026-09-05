import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart3, Plus, Trash2, Pencil, X, Check, Loader2, Search, Download, RefreshCw,
  ChevronRight, ChevronDown, BookOpen, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn, downloadBlob } from '@/shared/lib';
import Button from '@/shared/components/ui/Button';
import { projectionApi } from '../api/projection.api';
import { coursesApi } from '../api/courses.api';
import { CreateCourseForm } from '../components/courses/CreateCourseForm';
import type { AcademicProgram, CategoryHierarchyNode } from '../types/projection.types';

const TABS = [
  { id: 'programs', label: 'Programas' },
  { id: 'study-plan', label: 'Plan de Estudio' },
  { id: 'students', label: 'Estudiantes por Programa' },
  { id: 'demand-subject', label: 'Demanda por Asignatura' },
  { id: 'demand-level', label: 'Demanda por Nivel' },
  { id: 'sections', label: 'Proyección de Secciones' },
  { id: 'matrix', label: 'Matriz de Pendientes' },
];

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <p>{message}</p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-red-500">
      <p>{message}</p>
    </div>
  );
}

function ExportExcelButton({
  onExport,
  filename,
}: {
  onExport: () => Promise<Blob>;
  filename: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    try {
      setDownloading(true);
      setError(null);
      const blob = await onExport();
      downloadBlob(blob, filename);
    } catch {
      setError('Error al exportar');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-red-500">{error}</span>}
      <Button
        size="sm"
        variant="outline"
        onClick={handleClick}
        isLoading={downloading}
        leftIcon={<Download className="w-4 h-4" />}
      >
        Exportar Excel
      </Button>
    </div>
  );
}

function ProgramModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  isPending,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; code: string; description?: string }) => void;
  initialData?: AcademicProgram | null;
  isPending: boolean;
}) {
  const [name, setName] = useState(initialData?.name ?? '');
  const [code, setCode] = useState(initialData?.code ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Editar Programa' : 'Nuevo Programa'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave({ name, code, description: description || undefined });
          }}
          className="p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: ING-INFO"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Ej: Ingeniería Informática"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Descripción opcional"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isPending}>
              {initialData ? 'Guardar Cambios' : 'Crear Programa'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProgramsTab({ programs }: { programs: AcademicProgram[] }) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AcademicProgram | null>(null);
  const [expandedPrograms, setExpandedPrograms] = useState<Set<number>>(new Set());
  const [expandedMaterias, setExpandedMaterias] = useState<Set<number>>(new Set());

  // Obtener jerarquía de categorías para los despliegues
  const { data: hierarchy = [] } = useQuery({
    queryKey: ['category-hierarchy'],
    queryFn: projectionApi.getCategoryHierarchy,
  });

  // Mapear categorías por moodleCategoryId para acceso rápido
  const categoryMap = new Map<number, CategoryHierarchyNode>();
  const buildCategoryMap = (nodes: CategoryHierarchyNode[]) => {
    for (const node of nodes) {
      categoryMap.set(node.moodleId, node);
      buildCategoryMap(node.children);
    }
  };
  buildCategoryMap(hierarchy);

  const toggleProgram = (programId: number) => {
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(programId)) {
        next.delete(programId);
      } else {
        next.add(programId);
      }
      return next;
    });
  };

  const toggleMateria = (materiaId: number) => {
    setExpandedMaterias((prev) => {
      const next = new Set(prev);
      if (next.has(materiaId)) {
        next.delete(materiaId);
      } else {
        next.add(materiaId);
      }
      return next;
    });
  };

  const createMutation = useMutation({
    mutationFn: projectionApi.createProgram,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-programs'] });
      setModalOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ name: string; code: string; description?: string }> }) =>
      projectionApi.updateProgram(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-programs'] });
      setModalOpen(false);
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectionApi.deleteProgram,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['academic-programs'] }),
  });

  const syncCategoriesMutation = useMutation({
    mutationFn: () => coursesApi.syncCategories(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['academic-programs'] });
      queryClient.invalidateQueries({ queryKey: ['category-hierarchy'] });
      if (result.programsCreated > 0) {
        toast.success(
          `Categorías sincronizadas (${result.synced}). Programas creados: ${result.programsCreated}.`,
        );
      } else {
        toast.success(
          `Categorías sincronizadas (${result.synced}). No se crearon programas nuevos.`,
        );
      }
    },
    onError: () => toast.error('Error al sincronizar categorías'),
  });

  const cleanupMutation = useMutation({
    mutationFn: () => projectionApi.cleanupInvalidPrograms(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['academic-programs'] });
      queryClient.invalidateQueries({ queryKey: ['category-hierarchy'] });
      if (result.deleted > 0) {
        toast.success(
          `Limpieza completada. ${result.deleted} programas eliminados, ${result.skipped} omitidos.`,
        );
      } else if (result.skipped > 0) {
        toast.success(
          `No se eliminaron programas. ${result.skipped} programas tienen estudiantes asignados.`,
        );
      } else {
        toast.success('No hay programas inválidos para limpiar.');
      }
    },
    onError: () => toast.error('Error al limpiar programas'),
  });

  // Renderizar filas de materias (hijos de un programa)
  const renderMateriaRows = (children: CategoryHierarchyNode[], level: number = 1) => {
    return children.map((category) => {
      const isExpanded = expandedMaterias.has(category.moodleId);
      const hasChildren = category.children.length > 0;
      const hasMoodleCourses = category.courses.length > 0 || category.coursecount > 0;
      const isExpandable = hasChildren || hasMoodleCourses;

      return (
        <React.Fragment key={`category-${category.moodleId}`}>
          <tr className="bg-emerald-50/50 hover:bg-emerald-50">
            <td className="px-4 py-2 text-gray-600" style={{ paddingLeft: `${level * 24 + 16}px` }}>
              <div className="flex items-center gap-2">
                {isExpandable ? (
                  <button
                    onClick={() => toggleMateria(category.moodleId)}
                    className="p-0.5 hover:bg-emerald-100 rounded"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-emerald-600" /> : <ChevronRight className="w-4 h-4 text-emerald-600" />}
                  </button>
                ) : (
                  <span className="w-5" />
                )}
                <FileText className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Materia</span>
              </div>
            </td>
            <td className="px-4 py-2 text-gray-700">{category.name}</td>
            <td className="px-4 py-2 text-gray-400 text-xs">
              {category.coursecount > 0 && `${category.coursecount} cursos`}
              {category.coursecount > 0 && category.children.length > 0 && ' · '}
              {category.children.length > 0 && `${category.children.length} subcategorías`}
            </td>
            <td></td>
          </tr>
          {/* Renderizar subcategorías hijas */}
          {isExpanded && hasChildren && renderMateriaRows(category.children, level + 1)}
          {/* Renderizar cursos de Moodle dentro de esta materia */}
          {isExpanded && hasMoodleCourses && category.courses.map((curso) => (
            <tr key={`curso-${curso.moodleId}`} className="bg-amber-50/50 hover:bg-amber-50">
              <td className="px-4 py-2 text-gray-600" style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}>
                <div className="flex items-center gap-2">
                  <span className="w-5" />
                  <BookOpen className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Curso</span>
                </div>
              </td>
              <td className="px-4 py-2 text-gray-700">{curso.fullname}</td>
              <td className="px-4 py-2 text-gray-400 text-xs">{curso.shortname}</td>
              <td></td>
            </tr>
          ))}
          {/* Mensaje si está expandido pero no tiene nada */}
          {isExpanded && !hasChildren && !hasMoodleCourses && (
            <tr className="bg-gray-50">
              <td colSpan={4} className="px-4 py-2 text-gray-500 text-sm italic" style={{ paddingLeft: `${(level + 1) * 24 + 16}px` }}>
                Sin cursos ni subcategorías registrados
              </td>
            </tr>
          )}
        </React.Fragment>
      );
    });
  };

  return (
    <div>
      <div className="flex justify-end gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm('¿Eliminar programas creados desde categorías que no son raíz? Esta acción no se puede deshacer.')) {
              cleanupMutation.mutate();
            }
          }}
          isLoading={cleanupMutation.isPending}
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Limpiar inválidos
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => syncCategoriesMutation.mutate()}
          isLoading={syncCategoriesMutation.isPending}
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Sincronizar categorías
        </Button>
        <Button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Nuevo Programa
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Código</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Nombre</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {programs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No hay programas académicos registrados
                </td>
              </tr>
            ) : (
              programs.map((program) => {
                const isExpanded = expandedPrograms.has(program.id);
                const categoryData = program.moodleCategoryId ? categoryMap.get(Number(program.moodleCategoryId)) : null;
                const hasSubcategories = categoryData && categoryData.children.length > 0;

                return (
                  <React.Fragment key={program.id}>
                    <tr className={cn('hover:bg-gray-50', isExpanded && 'bg-indigo-50/50')}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {hasSubcategories ? (
                            <button
                              onClick={() => toggleProgram(program.id)}
                              className="p-0.5 hover:bg-indigo-100 rounded"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-600" /> : <ChevronRight className="w-4 h-4 text-indigo-600" />}
                            </button>
                          ) : (
                            <span className="w-5" />
                          )}
                          <span className="font-medium text-gray-900">{program.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>{program.name}</span>
                          {program.moodleCategoryId != null && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                              title="Programa sincronizado desde una categoría de Moodle"
                            >
                              Moodle
                            </span>
                          )}
                          {hasSubcategories && (
                            <span className="text-xs text-gray-400">
                              ({categoryData.children.length} materias)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {program.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => { setEditing(program); setModalOpen(true); }}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Eliminar el programa "${program.name}"?`)) {
                                deleteMutation.mutate(program.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Renderizar subcategorías (materias) del programa */}
                    {isExpanded && categoryData && hasSubcategories && renderMateriaRows(categoryData.children)}
                    {/* Mensaje si está expandido pero no tiene materias */}
                    {isExpanded && categoryData && !hasSubcategories && (
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="px-4 py-2 text-gray-500 text-sm italic pl-12">
                          Sin materias registradas en este programa
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ProgramModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={(data) => {
          if (editing) {
            updateMutation.mutate({ id: editing.id, data });
          } else {
            createMutation.mutate(data);
          }
        }}
        initialData={editing}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

type Subprogram = {
  id: number;
  moodleId: number;
  code: string;
  name: string;
  parent: number;
  coursecount: number;
};

function SubprogramSelector({
  subprograms,
  selectedMoodleId,
  onChange,
  label = 'Subprograma:',
}: {
  subprograms: Subprogram[];
  selectedMoodleId: number | null;
  onChange: (moodleId: number | null) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <select
        value={selectedMoodleId ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
      >
        <option value="">Todos</option>
        {subprograms.map((sp) => (
          <option key={sp.moodleId} value={sp.moodleId}>{sp.name}</option>
        ))}
      </select>
    </div>
  );
}

function StudyPlanTab({ subprograms }: { subprograms: Subprogram[] }) {
  const queryClient = useQueryClient();
  const [selectedMoodleId, setSelectedMoodleId] = useState<number | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [expandedMaterias, setExpandedMaterias] = useState<Set<number>>(new Set());

  const { data: programs = [] } = useQuery({
    queryKey: ['academic-programs'],
    queryFn: projectionApi.getPrograms,
  });

  const { data: studyPlanData, isLoading, isError } = useQuery({
    queryKey: ['study-plans', selectedMoodleId],
    queryFn: () => projectionApi.getStudyPlans(selectedMoodleId!),
    enabled: !!selectedMoodleId,
  });
  const materias = studyPlanData?.materias ?? [];
  const selectedSubprogram = subprograms.find((sp) => sp.moodleId === selectedMoodleId);
  const selectedProgram = selectedSubprogram
    ? programs.find((program) => Number(program.moodleCategoryId) === selectedSubprogram.parent)
    : undefined;

  const removeMutation = useMutation({
    mutationFn: projectionApi.removeStudyPlan,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['study-plans', selectedMoodleId] }),
  });

  const autoAssignMutation = useMutation({
    mutationFn: projectionApi.autoAssignCoursesToPrograms,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['study-plans', selectedMoodleId] });
      queryClient.invalidateQueries({ queryKey: ['moodle-courses'] });
      if (result.coursesAssigned > 0) {
        toast.success(`Cursos asignados automáticamente: ${result.coursesAssigned}`);
      } else {
        toast.success('No había cursos nuevos por asignar');
      }
    },
    onError: () => toast.error('Error al asignar cursos automáticamente'),
  });

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SubprogramSelector subprograms={subprograms} selectedMoodleId={selectedMoodleId} onChange={setSelectedMoodleId} />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => autoAssignMutation.mutate()}
            isLoading={autoAssignMutation.isPending}
            disabled={!selectedMoodleId}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Asignar automáticamente
          </Button>
          <Button
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            disabled={!selectedProgram}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Crear Curso
          </Button>
        </div>
      </div>

      {!selectedMoodleId && <EmptyState message="Selecciona un subprograma para ver su plan de estudio" />}

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorState message="Error al cargar el plan de estudio" />}

      {selectedMoodleId && !isLoading && !isError && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Curso</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nivel</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materias.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No hay materias registradas en este subprograma.
                  </td>
                </tr>
              ) : (
                materias.map((materia) => (
                  <React.Fragment key={materia.moodleId}>
                    <tr className="bg-indigo-50/60">
                      <td colSpan={2} className="px-4 py-3 font-semibold text-gray-800">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedMaterias((previous) => {
                              const next = new Set(previous);
                              if (next.has(materia.moodleId)) next.delete(materia.moodleId);
                              else next.add(materia.moodleId);
                              return next;
                            })}
                            className="p-0.5 hover:bg-indigo-100 rounded"
                            title={expandedMaterias.has(materia.moodleId) ? 'Contraer materia' : 'Expandir materia'}
                          >
                            {expandedMaterias.has(materia.moodleId)
                              ? <ChevronDown className="w-4 h-4 text-indigo-600" />
                              : <ChevronRight className="w-4 h-4 text-indigo-600" />}
                          </button>
                          <FileText className="w-4 h-4 text-indigo-600" />
                          {materia.name}
                          <span className="text-xs font-normal text-gray-500">({materia.cursos.length} cursos)</span>
                        </div>
                      </td>
                      <td></td>
                    </tr>
                    {expandedMaterias.has(materia.moodleId) && materia.cursos.length === 0 ? (
                      <tr><td colSpan={3} className="px-10 py-3 text-sm text-gray-400 italic">Sin cursos en esta materia</td></tr>
                    ) : expandedMaterias.has(materia.moodleId) && materia.cursos.map((curso) => (
                      <tr key={curso.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 pl-10 text-gray-700">{curso.courseName}</td>
                        <td className="px-4 py-3 text-gray-700">Nivel {curso.level}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              if (window.confirm('¿Eliminar este curso del plan de estudio?')) removeMutation.mutate(curso.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {createModalOpen && selectedMoodleId && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setCreateModalOpen(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Crear curso en {selectedSubprogram?.name}</h2>
              <button onClick={() => setCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600" title="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <CreateCourseForm
                projectionProgramId={selectedProgram.id}
                subprogramMoodleId={selectedMoodleId}
                onSuccess={() => {
                  setCreateModalOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['study-plans', selectedMoodleId] });
                }}
                onCancel={() => setCreateModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentsTab({ programs, subprograms }: { programs: AcademicProgram[]; subprograms: Subprogram[] }) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 10;
  const subprogramMoodleIds = new Set(subprograms.map((subprogram) => subprogram.moodleId));
  const assignablePrograms = programs.filter(
    (program) => program.moodleCategoryId != null && subprogramMoodleIds.has(Number(program.moodleCategoryId)),
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: ['projection-students', page, search],
    queryFn: () => projectionApi.getStudents(page, PAGE_SIZE, search || undefined),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ userId, programId }: { userId: number; programId: number }) =>
      projectionApi.toggleStudentProgram(userId, programId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projection-students'] });
    },
    onError: () => toast.error('Error al actualizar la asignación de subprograma'),
  });

  const students = data?.students ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  return (
    <div>
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-60">
            <label className="block text-xs font-medium text-gray-500 mb-1">Buscar estudiante</label>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nombre, apellido, matrícula o correo"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={!searchInput.trim()}
            leftIcon={<Search className="w-4 h-4" />}
            size="sm"
          >
            Buscar
          </Button>
          {search && (
            <Button onClick={handleClearSearch} size="sm" variant="outline">
              Limpiar
            </Button>
          )}
        </div>
      </div>

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorState message="Error al cargar los estudiantes" />}

      {!isLoading && !isError && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estudiante</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Matrícula</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
                  {assignablePrograms.map((program) => (
                    <th
                      key={program.id}
                      className="text-center px-4 py-3 font-medium text-gray-600 whitespace-nowrap"
                      title={program.name}
                    >
                      {program.code} - {program.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={3 + assignablePrograms.length} className="px-4 py-8 text-center text-gray-500">
                      {search ? 'No hay estudiantes que coincidan con la búsqueda' : 'No hay estudiantes registrados'}
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.moodleId} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{student.studentName}</p>
                        {student.email && <p className="text-xs text-gray-400">{student.email}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{student.matriculation ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            student.suspended
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-emerald-100 text-emerald-700',
                          )}
                        >
                          {student.suspended ? 'Inactivo' : 'Activo'}
                        </span>
                      </td>
                      {assignablePrograms.map((program) => {
                        const checked = student.programIds.includes(program.id);
                        return (
                          <td key={program.id} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={toggleMutation.isPending}
                              onChange={() =>
                                toggleMutation.mutate({
                                  userId: student.moodleId,
                                  programId: program.id,
                                })
                              }
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                              title={`${checked ? 'Quitar' : 'Asignar'} ${student.studentName} al subprograma ${program.code}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Mostrando {(page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, total)} de {total} estudiantes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DemandBySubjectTab({ subprograms }: { subprograms: Subprogram[] }) {
  const [selectedMoodleId, setSelectedMoodleId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Auto-seleccionar el primer subprograma cuando se carguen
  React.useEffect(() => {
    if (subprograms.length > 0 && selectedMoodleId === null) {
      setSelectedMoodleId(subprograms[0].moodleId);
    }
  }, [subprograms, selectedMoodleId]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-grades-matrix', selectedMoodleId, page],
    queryFn: () => projectionApi.getStudentGradesMatrix(selectedMoodleId!, page, PAGE_SIZE),
    enabled: !!selectedMoodleId,
  });

  const courses = data?.courses ?? [];
  const students = data?.students ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Resetear página al cambiar subprograma
  const handleSubprogramChange = (moodleId: number | null) => {
    setSelectedMoodleId(moodleId);
    setPage(1);
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <SubprogramSelector
          subprograms={subprograms}
          selectedMoodleId={selectedMoodleId}
          onChange={handleSubprogramChange}
        />
      </div>

      {!selectedMoodleId && subprograms.length === 0 && (
        <EmptyState message="No hay subprogramas académicos registrados" />
      )}

      {isLoading && <LoadingSpinner />}
      {isError && <ErrorState message="Error al cargar las notas de estudiantes" />}

      {selectedMoodleId && !isLoading && !isError && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="sticky left-0 z-10 bg-gray-50 text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                    Estudiante
                  </th>
                  {courses.map((course) => (
                    <th
                      key={course.id}
                      title={course.name}
                      className="text-center px-3 py-3 font-medium text-gray-600 whitespace-nowrap min-w-[90px]"
                    >
                      {course.shortname ||
                        (course.name.length > 12 ? `${course.name.slice(0, 12)}…` : course.name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={courses.length + 1} className="px-4 py-8 text-center text-gray-500">
                      No hay estudiantes enrolados en los cursos de este subprograma
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.moodleId} className="hover:bg-gray-50">
                      <td
                        title={student.name}
                        className={`sticky left-0 z-10 bg-white px-4 py-3 text-gray-700 whitespace-nowrap ${
                          student.suspended ? 'text-gray-400' : ''
                        }`}
                      >
                        {student.name}
                        {student.suspended ? ' (inactivo)' : ''}
                      </td>
                      {courses.map((course) => {
                        const grade = student.grades[course.id];
                        return (
                          <td key={course.id} className="px-3 py-3 text-center whitespace-nowrap">
                            {grade != null ? (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  grade >= 70
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-rose-100 text-rose-700'
                                }`}
                              >
                                {grade.toFixed(2)}
                              </span>
                            ) : null}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {total > 0 && (
            <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Mostrando {(page - 1) * PAGE_SIZE + 1} – {Math.min(page * PAGE_SIZE, total)} de {total} estudiantes
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="text-xs text-gray-600">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DemandByLevelTab({ subprograms }: { subprograms: Subprogram[] }) {
  const [selectedMoodleId, setSelectedMoodleId] = useState<number | null>(null);

  // Auto-seleccionar el primer subprograma cuando se carguen
  React.useEffect(() => {
    if (subprograms.length > 0 && selectedMoodleId === null) {
      setSelectedMoodleId(subprograms[0].moodleId);
    }
  }, [subprograms, selectedMoodleId]);

  const { data: demand = [], isLoading, isError } = useQuery({
    queryKey: ['demand-by-level', selectedMoodleId],
    queryFn: () => projectionApi.getDemandByLevel(selectedMoodleId ?? undefined),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <SubprogramSelector subprograms={subprograms} selectedMoodleId={selectedMoodleId} onChange={setSelectedMoodleId} />
        <ExportExcelButton
          filename="oferta_demanda_nivel.xlsx"
          onExport={() => projectionApi.exportDemandByLevel(selectedMoodleId ?? undefined)}
        />
      </div>
      {isLoading && <LoadingSpinner />}
      {isError && <ErrorState message="Error al cargar la demanda por nivel" />}
      {!isLoading && !isError && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nivel</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Cantidad de Estudiantes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {demand.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                    No hay datos de demanda por nivel
                  </td>
                </tr>
              ) : (
                demand.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">Nivel {row.level}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.studentCount}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SectionProjectionTab({ subprograms }: { subprograms: Subprogram[] }) {
  const [selectedMoodleId, setSelectedMoodleId] = useState<number | null>(null);

  // Auto-seleccionar el primer subprograma cuando se carguen
  React.useEffect(() => {
    if (subprograms.length > 0 && selectedMoodleId === null) {
      setSelectedMoodleId(subprograms[0].moodleId);
    }
  }, [subprograms, selectedMoodleId]);

  const { data: sections = [], isLoading, isError } = useQuery({
    queryKey: ['section-projection', selectedMoodleId],
    queryFn: () => projectionApi.getSectionProjection(selectedMoodleId ?? undefined),
  });

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <SubprogramSelector subprograms={subprograms} selectedMoodleId={selectedMoodleId} onChange={setSelectedMoodleId} />
        <ExportExcelButton
          filename="oferta_proyeccion_secciones.xlsx"
          onExport={() => projectionApi.exportSectionProjection(selectedMoodleId ?? undefined)}
        />
      </div>
      {isLoading && <LoadingSpinner />}
      {isError && <ErrorState message="Error al cargar la proyección de secciones" />}
      {!isLoading && !isError && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Asignatura</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Pendientes</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Secciones Necesarias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sections.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No hay datos de proyección de secciones
                  </td>
                </tr>
              ) : (
                sections.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{row.courseName}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.pendingCount}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {row.sectionsNeeded}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProjectionMatrixTab({ subprograms }: { subprograms: Subprogram[] }) {
  const [selectedMoodleId, setSelectedMoodleId] = useState<number | null>(null);

  // Auto-seleccionar el primer subprograma cuando se carguen
  React.useEffect(() => {
    if (subprograms.length > 0 && selectedMoodleId === null) {
      setSelectedMoodleId(subprograms[0].moodleId);
    }
  }, [subprograms, selectedMoodleId]);

  const { data: matrix = [], isLoading, isError } = useQuery({
    queryKey: ['projection-matrix', selectedMoodleId],
    queryFn: () => projectionApi.getProjectionMatrix(selectedMoodleId ?? undefined),
  });

  const allCourseNames = Array.from(
    new Set(matrix.flatMap((row) => row.courses.map((c) => c.courseName)))
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
        <SubprogramSelector subprograms={subprograms} selectedMoodleId={selectedMoodleId} onChange={setSelectedMoodleId} />
        <ExportExcelButton
          filename="oferta_matriz_pendientes.xlsx"
          onExport={() => projectionApi.exportProjectionMatrix(selectedMoodleId ?? undefined)}
        />
      </div>
      {isLoading && <LoadingSpinner />}
      {isError && <ErrorState message="Error al cargar la matriz de pendientes" />}
      {!isLoading && !isError && matrix.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">Estudiante</th>
                {allCourseNames.map((name) => (
                  <th key={name} className="text-center px-3 py-3 font-medium text-gray-600 text-xs whitespace-nowrap">
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matrix.map((row) => {
                const courseMap = new Map(row.courses.map((c) => [c.courseName, c.status]));
                return (
                  <tr key={row.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      {row.studentName || `Estudiante #${row.studentId}`}
                    </td>
                    {allCourseNames.map((name) => {
                      const status = courseMap.get(name);
                      return (
                        <td key={name} className="text-center px-3 py-3">
                          {status === 'approved' ? (
                            <Check className="w-4 h-4 text-green-500 mx-auto" />
                          ) : status === 'pending' ? (
                            <X className="w-4 h-4 text-red-400 mx-auto" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {!isLoading && !isError && matrix.length === 0 && (
        <EmptyState message="No hay datos de matriz de pendientes para mostrar" />
      )}
    </div>
  );
}

export default function AcademicProjection() {
  const [activeTab, setActiveTab] = useState('programs');

  const { data: programs = [], isLoading: programsLoading, isError: programsError } = useQuery({
    queryKey: ['academic-programs'],
    queryFn: projectionApi.getPrograms,
  });

  const { data: subprograms = [] } = useQuery({
    queryKey: ['subprograms'],
    queryFn: projectionApi.getSubprograms,
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <BarChart3 className="w-6 h-6 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900">Proyección de Oferta Académica</h1>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {programsLoading && <LoadingSpinner />}
      {programsError && <ErrorState message="Error al cargar los programas académicos" />}

      {!programsLoading && !programsError && (
        <>
          {activeTab === 'programs' && <ProgramsTab programs={programs} />}
          {activeTab === 'study-plan' && <StudyPlanTab subprograms={subprograms} />}
          {activeTab === 'students' && <StudentsTab programs={programs} subprograms={subprograms} />}
          {activeTab === 'demand-subject' && <DemandBySubjectTab subprograms={subprograms} />}
          {activeTab === 'demand-level' && <DemandByLevelTab subprograms={subprograms} />}
          {activeTab === 'sections' && <SectionProjectionTab subprograms={subprograms} />}
          {activeTab === 'matrix' && <ProjectionMatrixTab subprograms={subprograms} />}
        </>
      )}
    </div>
  );
}
