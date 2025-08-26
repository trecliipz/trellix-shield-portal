
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, CheckCircle, Clock, Eye } from 'lucide-react';

interface EPOEvent {
  id: string;
  event_id: string;
  customer_id: string;
  source: string;
  event_type: string;
  processed: boolean;
  processing_error: string | null;
  created_at: string;
  customers?: {
    company_name: string;
  };
}

const AdminEPOEvents: React.FC = () => {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['admin-epo-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('epo_events')
        .select(`
          id,
          event_id,
          customer_id,
          source,
          event_type,
          processed,
          processing_error,
          created_at,
          customers (
            company_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as EPOEvent[];
    },
  });

  const getProcessingStatus = (event: EPOEvent) => {
    if (event.processing_error) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Error
        </Badge>
      );
    } else if (event.processed) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Processed
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ePO Events</CardTitle>
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
          <CardTitle>ePO Events</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Error loading ePO events</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>ePO Events</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {events?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No ePO events found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events?.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    {event.event_type || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    {event.customers?.company_name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{event.source}</Badge>
                  </TableCell>
                  <TableCell>
                    {getProcessingStatus(event)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminEPOEvents;
