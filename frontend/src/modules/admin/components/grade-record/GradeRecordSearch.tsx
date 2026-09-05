import { Card, CardContent, Input, Spinner, Badge } from '@/shared/components/ui';
import { Search, User } from 'lucide-react';
import type { UserSearchResult } from '../../hooks/useAdminGradeRecord';

interface GradeRecordSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchLoading: boolean;
  searchResults: UserSearchResult[] | undefined;
  handleSelectUser: (user: UserSearchResult) => void;
}

export function GradeRecordSearch({
  searchQuery,
  setSearchQuery,
  searchLoading,
  searchResults,
  handleSelectUser,
}: GradeRecordSearchProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-semibold">Buscar Estudiante</h3>
        </div>
        <div className="relative">
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>

        {searchLoading && searchQuery.length >= 2 && (
          <div className="flex justify-center py-4">
            <Spinner />
          </div>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((user: UserSearchResult) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{user.displayName || user.email}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Badge variant="secondary">ID: {user.moodleUserId || user.id}</Badge>
              </div>
            ))}
          </div>
        )}

        {searchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
          <p className="text-center text-gray-500 py-4">No se encontraron usuarios</p>
        )}
      </CardContent>
    </Card>
  );
}
