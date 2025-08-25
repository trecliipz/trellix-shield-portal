import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Webhook, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface WebhookEvent {
  id: string;
  stripe_event_id: string;
  event_type: string;
  processed: boolean;
  processing_error: string | null;
  created_at: string;
  processed_at: string | null;
}

interface WebhookStats {
  total_events: number;
  processed_events: number;
  failed_events: number;
  recent_failures: number;
}

export const WebhookManagement = () => {
  const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([]);
  const [stats, setStats] = useState<WebhookStats>({
    total_events: 0,
    processed_events: 0,
    failed_events: 0,
    recent_failures: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadWebhookData();
  }, []);

  const loadWebhookData = async () => {
    try {
      setLoading(true);
      
      // Get recent webhook events
      const { data: events, error: eventsError } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventsError) throw eventsError;

      setWebhookEvents(events || []);

      // Calculate stats
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const newStats = {
        total_events: events?.length || 0,
        processed_events: events?.filter(e => e.processed).length || 0,
        failed_events: events?.filter(e => !e.processed && e.processing_error).length || 0,
        recent_failures: events?.filter(e => 
          !e.processed && 
          e.processing_error && 
          new Date(e.created_at) > oneDayAgo
        ).length || 0
      };

      setStats(newStats);

    } catch (error) {
      console.error('Error loading webhook data:', error);
      toast({
        title: "Error",
        description: "Failed to load webhook data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'checkout.session.completed':
        return 'bg-green-100 text-green-800';
      case 'customer.subscription.updated':
        return 'bg-blue-100 text-blue-800';
      case 'customer.subscription.deleted':
        return 'bg-red-100 text-red-800';
      case 'invoice.payment_failed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (event: WebhookEvent) => {
    if (event.processed) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else if (event.processing_error) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Webhook className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_events}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.processed_events}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed_events}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Failures</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.recent_failures}</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Webhook Operations</CardTitle>
          <CardDescription>
            Monitor and manage Stripe webhook events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button variant="outline" onClick={loadWebhookData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Events</CardTitle>
          <CardDescription>
            Stripe webhook processing history and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Event Type</TableHead>
                <TableHead>Stripe Event ID</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Processed</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhookEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(event)}
                      <span className="text-sm">
                        {event.processed ? 'Success' : event.processing_error ? 'Failed' : 'Pending'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getEventTypeColor(event.event_type)} variant="secondary">
                      {event.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {event.stripe_event_id}
                  </TableCell>
                  <TableCell>
                    {new Date(event.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {event.processed_at 
                      ? new Date(event.processed_at).toLocaleString() 
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    {event.processing_error ? (
                      <span className="text-red-600 text-sm">
                        {event.processing_error.substring(0, 50)}...
                      </span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};