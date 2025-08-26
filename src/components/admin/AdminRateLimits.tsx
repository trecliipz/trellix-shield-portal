
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { formatDistanceToNow } from 'date-fns';
import { Shield, TrendingUp } from 'lucide-react';

interface RateLimit {
  id: string;
  identifier: string;
  window_start: string;
  window_seconds: number;
  request_count: number;
  created_at: string;
  updated_at: string;
}

const AdminRateLimits: React.FC = () => {
  const { data: rateLimits, isLoading, error } = useQuery({
    queryKey: ['admin-rate-limits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_rate_limits')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as RateLimit[];
    },
  });

  const getUsagePercentage = (requestCount: number, limit: number = 60) => {
    return Math.min((requestCount / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>API Rate Limits</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading rate limit data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>API Rate Limits</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rateLimits?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No rate limit data found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Identifier</TableHead>
                <TableHead>Window (seconds)</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Last Activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rateLimits?.map((limit) => {
                const usagePercentage = getUsagePercentage(limit.request_count);
                return (
                  <TableRow key={limit.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm">{limit.identifier}</span>
                        {usagePercentage >= 90 && (
                          <TrendingUp className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{limit.window_seconds}s</TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{limit.request_count}/60 requests</span>
                          <span>{usagePercentage.toFixed(1)}%</span>
                        </div>
                        <Progress 
                          value={usagePercentage} 
                          className="h-2"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDistanceToNow(new Date(limit.updated_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminRateLimits;
