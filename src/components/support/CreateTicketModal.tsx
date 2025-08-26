
import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateTicketForm {
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface CreateTicketModalProps {
  open: boolean;
  onClose: () => void;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<CreateTicketForm>({
    defaultValues: {
      priority: 'normal'
    }
  });

  const priority = watch('priority');

  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketForm) => {
      // First, get the current user's customer_id
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data: customerUser } = await supabase
        .from('customer_users')
        .select('customer_id')
        .eq('user_id', userData.user.id)
        .single();

      if (!customerUser) throw new Error('No customer association found');

      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert({
          customer_id: customerUser.customer_id,
          user_id: userData.user.id,
          subject: data.subject,
          description: data.description,
          priority: data.priority,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;
      return ticket;
    },
    onSuccess: () => {
      toast.success('Support ticket created successfully');
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      reset();
      onClose();
    },
    onError: (error) => {
      console.error('Failed to create ticket:', error);
      toast.error('Failed to create support ticket');
    }
  });

  const onSubmit = (data: CreateTicketForm) => {
    createTicketMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Support Ticket</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              {...register('subject', { required: 'Subject is required' })}
              placeholder="Brief description of your issue"
            />
            {errors.subject && (
              <p className="text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select value={priority} onValueChange={(value) => setValue('priority', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description', { required: 'Description is required' })}
              placeholder="Please provide detailed information about your issue..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTicketMutation.isPending}
            >
              {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTicketModal;
