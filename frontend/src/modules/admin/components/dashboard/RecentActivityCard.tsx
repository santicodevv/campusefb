import { Card, CardContent, Spinner } from '@/shared/components/ui';
import { CheckCircle, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import type { RecentActivity } from '../../types/dashboard.types';

interface RecentActivityCardProps {
  recentActivity: RecentActivity[] | undefined;
  activityLoading: boolean;
}

export function RecentActivityCard({ recentActivity, activityLoading }: RecentActivityCardProps) {
  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Actividad Reciente</h3>
        </div>
        {activityLoading ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : recentActivity && recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-full ${
                      activity.action === 'CREATE'
                        ? 'bg-green-100'
                        : activity.action === 'UPDATE'
                          ? 'bg-blue-100'
                          : activity.action === 'DELETE'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                    }`}
                  >
                    {activity.action === 'CREATE' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : activity.action === 'DELETE' ? (
                      <XCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <RefreshCw className="h-4 w-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action} - {activity.entity}
                    </p>
                    <p className="text-xs text-gray-500">{activity.actor?.email || 'Sistema'}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(activity.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <AlertCircle className="h-5 w-5 mr-2" />
            No hay actividad reciente
          </div>
        )}
      </CardContent>
    </Card>
  );
}
