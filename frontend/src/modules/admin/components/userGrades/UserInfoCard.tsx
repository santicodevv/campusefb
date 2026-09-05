import { Card, CardContent } from '@/shared/components/ui';
import { User } from 'lucide-react';

interface UserInfoCardProps {
  user: {
    email: string;
    displayName: string | null;
  };
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {user.displayName || user.email}
            </h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
