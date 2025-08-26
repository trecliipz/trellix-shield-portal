
import React, { useState } from 'react';
import SupportTicketList from './SupportTicketList';
import CreateTicketModal from './CreateTicketModal';

const SupportSection: React.FC = () => {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleTicketSelect = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    // In a full implementation, this would show ticket details
    console.log('Selected ticket:', ticketId);
  };

  const handleCreateTicket = () => {
    setShowCreateModal(true);
  };

  return (
    <div className="space-y-6">
      <SupportTicketList 
        onTicketSelect={handleTicketSelect}
        onCreateTicket={handleCreateTicket}
      />
      
      <CreateTicketModal 
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />
    </div>
  );
};

export default SupportSection;
