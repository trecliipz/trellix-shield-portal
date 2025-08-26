
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MessageSquare, AlertTriangle, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
  last_activity_at: string;
  support_ticket_comments?: { id: string }[];
}

interface SupportTicketListProps {
  onTicketSelect: (ticketId: string) => void;
  onCreateTicket: () => void;
}

const SupportTicketList: React.FC<SupportTicketListProps> = ({ onTicketSelect, onCreateTicket }) => {
  const { data: tickets, isLoading, error } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_tickets')
        .select(`
          id,
          subject,
          description,
          status,
          priority,
          created_at,
          last_activity_at,
          support_ticket_comments (id)
        `)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;
      return data as SupportTicket[];
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertTriangle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-red-600">Error loading support tickets</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <Button onClick={onCreateTicket}>Create New Ticket</Button>
      </div>

      {tickets?.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets</h3>
            <p className="text-gray-600 mb-4">You haven't created any support tickets yet.</p>
            <Button onClick={onCreateTicket}>Create Your First Ticket</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tickets?.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-medium line-clamp-1">{ticket.subject}</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                    <Badge className={getStatusColor(ticket.status)}>
                      <span className="flex items-center space-x-1">
                        {getStatusIcon(ticket.status)}
                        <span>{ticket.status.replace('_', ' ')}</span>
                      </span>
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>
                      Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </span>
                    {ticket.support_ticket_comments && (
                      <span className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{ticket.support_ticket_comments.length} comments</span>
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onTicketSelect(ticket.id)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SupportTicketList;
