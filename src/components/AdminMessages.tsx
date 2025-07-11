import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Reply, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Bug, 
  Lightbulb, 
  HelpCircle,
  Paperclip
} from "lucide-react";

interface Message {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  category: 'bug' | 'feature' | 'support' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  attachments?: { name: string; size: number; type: string }[];
  createdAt: string;
  updatedAt: string;
  adminResponse?: string;
  adminId?: string;
}

export const AdminMessages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false);

  useEffect(() => {
    loadMessages();

    // Listen for new messages
    const handleNewMessage = (event: CustomEvent) => {
      const newMessage = event.detail;
      setMessages(prev => [newMessage, ...prev]);
      toast.info("New message received!", {
        description: `${newMessage.category} from ${newMessage.userName}`
      });
    };

    window.addEventListener('newMessage', handleNewMessage as EventListener);

    return () => {
      window.removeEventListener('newMessage', handleNewMessage as EventListener);
    };
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  const loadMessages = () => {
    const savedMessages = localStorage.getItem('admin_messages');
    if (savedMessages) {
      const parsedMessages = JSON.parse(savedMessages);
      setMessages(parsedMessages.sort((a: Message, b: Message) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    }
  };

  const filterMessages = () => {
    let filtered = messages;

    if (searchTerm) {
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(msg => msg.category === categoryFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(msg => msg.priority === priorityFilter);
    }

    setFilteredMessages(filtered);
  };

  const updateMessageStatus = (messageId: string, newStatus: Message['status']) => {
    const updatedMessages = messages.map(msg =>
      msg.id === messageId
        ? { ...msg, status: newStatus, updatedAt: new Date().toISOString() }
        : msg
    );
    setMessages(updatedMessages);
    localStorage.setItem('admin_messages', JSON.stringify(updatedMessages));
    toast.success(`Message marked as ${newStatus}`);
  };

  const sendReply = () => {
    if (!selectedMessage || !replyText.trim()) return;

    const updatedMessages = messages.map(msg =>
      msg.id === selectedMessage.id
        ? { 
            ...msg, 
            adminResponse: replyText,
            adminId: 'admin@trellix.com',
            status: 'resolved' as const,
            updatedAt: new Date().toISOString()
          }
        : msg
    );
    
    setMessages(updatedMessages);
    localStorage.setItem('admin_messages', JSON.stringify(updatedMessages));
    
    setReplyText("");
    setIsReplyDialogOpen(false);
    setSelectedMessage(null);
    
    toast.success("Reply sent successfully!");
  };

  const categoryIcons = {
    bug: <Bug className="h-4 w-4" />,
    feature: <Lightbulb className="h-4 w-4" />,
    support: <HelpCircle className="h-4 w-4" />,
    security: <AlertTriangle className="h-4 w-4" />
  };

  const statusIcons = {
    new: <Clock className="h-4 w-4" />,
    'in-progress': <Clock className="h-4 w-4 text-blue-500" />,
    resolved: <CheckCircle className="h-4 w-4 text-green-500" />,
    closed: <XCircle className="h-4 w-4 text-muted-foreground" />
  };

  const priorityColors = {
    low: "bg-muted text-muted-foreground",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  };

  const statusCounts = {
    new: messages.filter(m => m.status === 'new').length,
    'in-progress': messages.filter(m => m.status === 'in-progress').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
    closed: messages.filter(m => m.status === 'closed').length
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">Message Management</h3>
          {statusCounts.new > 0 && (
            <Badge variant="destructive">{statusCounts.new} New</Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">New</p>
                <p className="text-2xl font-bold text-orange-600">{statusCounts.new}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{statusCounts['in-progress']}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{statusCounts.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Closed</p>
                <p className="text-2xl font-bold text-muted-foreground">{statusCounts.closed}</p>
              </div>
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="support">General Support</SelectItem>
                  <SelectItem value="security">Security Issue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No messages found</p>
            </CardContent>
          </Card>
        ) : (
          filteredMessages.map((message) => (
            <Card key={message.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {categoryIcons[message.category]}
                    <div>
                      <h4 className="font-semibold">{message.subject}</h4>
                      <p className="text-sm text-muted-foreground">
                        From: {message.userName} ({message.userEmail})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={priorityColors[message.priority]}>
                      {message.priority.toUpperCase()}
                    </Badge>
                    <Badge variant={
                      message.status === 'new' ? 'destructive' :
                      message.status === 'in-progress' ? 'default' :
                      message.status === 'resolved' ? 'default' : 'secondary'
                    }>
                      {statusIcons[message.status]}
                      <span className="ml-1">{message.status.replace('-', ' ').toUpperCase()}</span>
                    </Badge>
                  </div>
                </div>

                <p className="text-sm mb-4 line-clamp-3">{message.message}</p>

                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Paperclip className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {message.attachments.length} attachment(s)
                    </span>
                  </div>
                )}

                {message.adminResponse && (
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-1">Admin Response:</p>
                    <p className="text-sm">{message.adminResponse}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Created: {new Date(message.createdAt).toLocaleString()}
                  </p>
                  <div className="flex space-x-2">
                    {message.status !== 'closed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateMessageStatus(message.id, 'in-progress')}
                          disabled={message.status === 'in-progress'}
                        >
                          Mark In Progress
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedMessage(message);
                            setIsReplyDialogOpen(true);
                          }}
                        >
                          <Reply className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateMessageStatus(message.id, 'closed')}
                      disabled={message.status === 'closed'}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Reply Dialog */}
      <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">{selectedMessage.subject}</h4>
                <p className="text-sm">{selectedMessage.message}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  From: {selectedMessage.userName} ({selectedMessage.userEmail})
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Response</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your response here..."
                  rows={6}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsReplyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={sendReply}
                  disabled={!replyText.trim()}
                >
                  <Reply className="h-4 w-4 mr-1" />
                  Send Reply
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};