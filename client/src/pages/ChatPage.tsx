import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatbotApi } from "@/services/chatbot-api";
import {
  KnowledgeBase,
  ChatSession,
  ChatMessage,
} from "../../../shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  MessageSquare,
  Plus,
  Send,
  FileText,
  ChevronRight,
  Bot,
  User,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Citation Card Component
const CitationCard = ({
  documentName,
  content,
}: {
  documentName: string;
  content: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="group border border-border/60 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="flex items-center gap-2 p-2">
        <FileText className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-medium text-foreground truncate flex-1">
          {documentName}
        </span>
        <ChevronRight
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isExpanded && "rotate-90"
          )}
        />
      </div>
      {isExpanded && (
        <div className="px-3 pb-3 pt-0">
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2">
            {content}
          </p>
        </div>
      )}
    </div>
  );
};


// Chat Message Component
const ChatMessageBubble = ({
  message,
  isTyping = false,
}: {
  message: ChatMessage;
  isTyping?: boolean;
}) => {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div
        className={cn(
          "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
        )}
      >
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div
        className={cn("flex flex-col gap-2 max-w-[75%]", isUser && "items-end")}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-md"
              : "bg-card border border-border shadow-xs rounded-tl-md"
          )}
        >
          {isTyping ? (
            <div className="flex gap-1.5 py-1">
              <span className="w-2 h-2 bg-muted-foreground/60 rounded-lg animate-bounce" />
              <span
                className="w-2 h-2 bg-muted-foreground/60 rounded-lg animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <span
                className="w-2 h-2 bg-muted-foreground/60 rounded-lg animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
          ) : isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="text-sm leading-relaxed prose prose-sm max-w-none dark:prose-invert prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-headings:font-semibold prose-strong:font-semibold prose-strong:text-foreground prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && message.citations && message.citations.length > 0 && (
          <div className="flex flex-col gap-1.5 w-full">
            <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Sources
            </span>
            <div className="grid gap-1.5">
              {message.citations.map((citation, index) => (
                <CitationCard
                  key={index}
                  documentName={citation.document_name}
                  content={citation.content}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Empty State Component
const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col items-center justify-center h-full text-center p-8">
    <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
    {action}
  </div>
);

// Main Chat Page Component
export default function ChatPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<ChatSession | null>(null);

  // Queries
  const { data: knowledgeBases, isLoading: isLoadingKBs } = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: () => chatbotApi.getKnowledgeBases(),
  });

  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: () => chatbotApi.getSessions(),
  });

  const { data: messages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ["messages", selectedSession?.id],
    queryFn: () =>
      selectedSession ? chatbotApi.getMessages(selectedSession.id) : null,
    enabled: !!selectedSession,
  });

  // Mutations
  const createSessionMutation = useMutation({
    mutationFn: ({
      knowledgeBaseId,
      title,
    }: {
      knowledgeBaseId: string;
      title: string;
    }) => chatbotApi.createSession(knowledgeBaseId, title),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      setSelectedSession(response.data);
      toast({
        title: "Chat Session Created",
        description: "Start chatting with your knowledge base!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({
      sessionId,
      content,
    }: {
      sessionId: string;
      content: string;
    }) => chatbotApi.sendMessage(sessionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedSession?.id],
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (sessionId: string) => chatbotApi.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      // Clear selection if deleted session was selected
      if (sessionToDelete?.id === selectedSession?.id) {
        setSelectedSession(null);
      }
      setSessionToDelete(null);
      setShowDeleteConfirm(false);
      toast({
        title: "Chat Deleted",
        description: "Chat history has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting chat",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleNewChat = () => {
    setSelectedSession(null);
    setMessageInput("");
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isSending) return;

    const content = messageInput.trim();
    setMessageInput("");
    setIsSending(true);

    try {
      let currentSessionId = selectedSession?.id;

      // If no session exists, create one first
      if (!currentSessionId) {
        if (!knowledgeBases?.data?.length) {
          toast({
            title: "No Knowledge Bases Available",
            description: "Please contact your administrator to create a knowledge base.",
            variant: "destructive",
          });
          return;
        }

        // Use the first knowledge base by default
        const defaultKB = knowledgeBases.data[0];
        
        // Generate title from first message
        const title = content.length > 50 ? content.substring(0, 50) + "..." : content;

        // Create the session
        const newSessionResponse = await createSessionMutation.mutateAsync({
          knowledgeBaseId: defaultKB.id,
          title: title,
        });
        
        currentSessionId = newSessionResponse.data.id;
        // Optimization: Set selected session immediately so UI updates
        setSelectedSession(newSessionResponse.data);
      }

      await sendMessageMutation.mutateAsync({
        sessionId: currentSessionId,
        content,
      });
    } catch (error) {
      console.error("Error in chat flow:", error);
      // specific error handling is done in mutations
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Find KB name for a session
  const getKBNameForSession = (session: ChatSession): string => {
    const kb = knowledgeBases?.data?.find(kb => kb.id === session.knowledge_base_id);
    return kb?.name || "Unknown";
  };

  // Delete session handlers
  const handleDeleteSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation(); // Prevent session selection
    setSessionToDelete(session);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteSession = () => {
    if (sessionToDelete) {
      deleteSessionMutation.mutate(sessionToDelete.id);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Chat Sessions */}
      <div className="w-72 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">

              Chat Sessions
            </h2>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-7 w-7"
              onClick={handleNewChat}
              disabled={isLoadingKBs}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {sessions?.data?.length || 0} conversation{(sessions?.data?.length || 0) !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Sessions List */}
        <ScrollArea className="flex-1 p-4">
          {isLoadingSessions ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sessions?.data?.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No chats yet</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={handleNewChat}
                disabled={isLoadingKBs}
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions?.data?.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex flex-col gap-1.5 p-3 rounded-lg cursor-pointer transition-all border",
                    selectedSession?.id === session.id
                      ? "bg-primary/5 border-primary/20 shadow-xs"
                      : "bg-transparent border-transparent hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedSession(session)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn(
                      "text-sm font-medium leading-snug line-clamp-2 break-words flex-1",
                      selectedSession?.id === session.id ? "text-primary" : "text-foreground"
                    )}>
                      {session.title}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(session.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => handleDeleteSession(e, session)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">
                      <Database className="w-3 h-3 opacity-70" />
                      <span className="max-w-[170px] truncate">
                        {getKBNameForSession(session)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Chat Header - Only show if session exists */}
        {selectedSession && (
          <div className="h-14 border-b border-border bg-card px-6 flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-sm font-semibold text-foreground max-w-md truncate">
                {selectedSession.title}
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Database className="w-3 h-3" />
                {getKBNameForSession(selectedSession)}
              </p>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            {!selectedSession ? (
              <EmptyState
                icon={MessageSquare}
                title="How can I help you today?"
                description="Start typing below to create a new chat session."
                action={
                  knowledgeBases?.data && knowledgeBases.data.length > 1 ? (
                    <div className="mt-4 flex gap-2 justify-center flex-wrap">
                      <span className="text-xs text-muted-foreground w-full mb-1">Active Knowledge Base:</span>
                      <Badge variant="secondary" className="font-normal">
                         <Database className="w-3 h-3" />
                         {knowledgeBases.data[0].name}
                      </Badge>
                    </div>
                  ) : null
                }
              />
            ) : isLoadingMessages ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      i % 2 === 0 ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                    <Skeleton className="h-16 w-64" />
                  </div>
                ))}
              </div>
            ) : messages?.data?.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="Start a conversation"
                description="Ask questions about your documents and get AI-powered answers with citations."
              />
            ) : (
              messages?.data?.map((message) => (
                <ChatMessageBubble key={message.id} message={message} />
              ))
            )}
            
            {isSending && (
              <ChatMessageBubble
                message={{
                  id: "typing",
                  chat_session_id: selectedSession?.id || "temp",
                  role: "assistant",
                  content: "",
                  created_at: new Date().toISOString(),
                }}
                isTyping
              />
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input Area - Always visible */}
        <div className="border-t border-border bg-card p-4">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Input
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedSession ? "Ask a question..." : "Start a new chat..."}
              className="flex-1"
              disabled={isSending}
              autoFocus
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageInput.trim() || isSending}
              size="icon"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat History</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sessionToDelete?.title}"? This action cannot be undone and all messages in this chat will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteSessionMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteSession}
              disabled={deleteSessionMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteSessionMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
