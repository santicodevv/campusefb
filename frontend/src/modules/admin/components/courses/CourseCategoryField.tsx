import { Label, Select, Button, Spinner } from '@/shared/components/ui';
import { RefreshCw } from 'lucide-react';
import type { UseMutationResult } from '@tanstack/react-query';
import type { MoodleCategory } from '@/shared/types';

interface CourseCategoryFieldProps {
  categories: MoodleCategory[] | undefined;
  categoriesLoading: boolean;
  categoryId: number;
  handleInputChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  syncCategoriesMutation: UseMutationResult<
    { synced: number; programsCreated: number },
    Error,
    void,
    unknown
  >;
}

export function CourseCategoryField({
  categories,
  categoriesLoading,
  categoryId,
  handleInputChange,
  syncCategoriesMutation,
}: CourseCategoryFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor="categoryid">
          Categoria de cursos <span className="text-red-500">*</span>
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => syncCategoriesMutation.mutate()}
          disabled={syncCategoriesMutation.isPending}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${syncCategoriesMutation.isPending ? 'animate-spin' : ''}`} />
          Sincronizar
        </Button>
      </div>
      {categoriesLoading ? (
        <div className="flex items-center gap-2 py-2">
          <Spinner className="h-4 w-4" />
          <span className="text-sm text-gray-500">Cargando categorias...</span>
        </div>
      ) : categories && categories.length > 0 ? (
        <Select
          id="categoryid"
          name="categoryid"
          value={categoryId}
          onChange={handleInputChange}
        >
          <option value="">Selecciona una categoria</option>
          {categories.map((cat: MoodleCategory) => (
            <option key={cat.moodleId} value={cat.moodleId}>
              {cat.name} {cat.coursecount > 0 && `(${cat.coursecount} cursos)`}
            </option>
          ))}
        </Select>
      ) : (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
          No hay categorias disponibles. Haz click en "Sincronizar" para obtener las categorias de Moodle.
        </div>
      )}
    </div>
  );
}
