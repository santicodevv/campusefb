import { Card, CardContent, Input, Label, Spinner } from '@/shared/components/ui';
import { Search, User } from 'lucide-react';
import type { UserSearchResult } from '../../types/user.types';

interface UserSearchProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  debouncedQuery: string;
  showDropdown: boolean;
  setShowDropdown: (val: boolean) => void;
  setSelectedUserId: (id: number | null) => void;
  searchLoading: boolean;
  searchResults?: UserSearchResult[];
  handleSelectUser: (user: UserSearchResult) => void;
}

export function UserSearch({
  searchQuery,
  setSearchQuery,
  debouncedQuery,
  showDropdown,
  setShowDropdown,
  setSelectedUserId,
  searchLoading,
  searchResults,
  handleSelectUser,
}: UserSearchProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="relative">
          <Label className="mb-2 block">Buscar Usuario</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                if (e.target.value.length < 2) {
                  setSelectedUserId(null);
                }
              }}
              onFocus={() => setShowDropdown(true)}
              className="pl-10"
            />
          </div>

          {showDropdown && debouncedQuery.length >= 2 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-64 overflow-y-auto">
              {searchLoading ? (
                <div className="flex justify-center py-4">
                  <Spinner className="h-5 w-5" />
                </div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="p-2 bg-blue-100 rounded-full">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.displayName || user.email}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  No se encontraron usuarios
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
