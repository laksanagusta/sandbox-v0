import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initializeOpenAI, sendMessage, Message, setConfirmationCallback, PendingConfirmation } from "@/lib/mcp/openai-client";
import { ToolOutput } from "./ToolOutput";
import { Loader2, Send, Sparkles, Mail, Calendar, FolderOpen, RotateCcw, AlertTriangle, Check, X } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/use-auth";

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Confirmation state - shows inline in chat (batch confirmation)
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation | null>(null);
  const [confirmationResolver, setConfirmationResolver] = useState<((value: boolean) => void) | null>(null);
  
  useEffect(() => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) {
      initializeOpenAI(envKey);
    }
  }, []);

  // Set up the confirmation callback
  useEffect(() => {
    const handleConfirmation = (pending: PendingConfirmation): Promise<boolean> => {
      return new Promise((resolve) => {
        setPendingConfirmation(pending);
        setConfirmationResolver(() => resolve);
      });
    };

    setConfirmationCallback(handleConfirmation);

    return () => {
      setConfirmationCallback(null);
    };
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmationResolver) {
      confirmationResolver(true);
    }
    setPendingConfirmation(null);
    setConfirmationResolver(null);
  }, [confirmationResolver]);

  const handleCancel = useCallback(() => {
    if (confirmationResolver) {
      confirmationResolver(false);
    }
    setPendingConfirmation(null);
    setConfirmationResolver(null);
  }, [confirmationResolver]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingConfirmation]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 200) + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error("VITE_OPENAI_API_KEY is missing in environment variables.");
      }

      const history = [...messages, userMsg];
      const newHistory = await sendMessage(history, (toolName, args) => {
        console.log("Calling", toolName, args);
      });

      setMessages(newHistory);
    } catch (error: any) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${error.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    { icon: Mail, text: "Check my emails today", color: "text-blue-500" },
    { icon: Calendar, text: "List my Zoom meetings", color: "text-purple-500" },
    { icon: FolderOpen, text: "Show recent Drive files", color: "text-green-500" },
  ];

  const hasMessages = messages.length > 0;

  // Get user initials for fallback
  const userInitials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() || 'U' : 'U';
  const userName = user ? `${user.first_name} ${user.last_name}`.trim() : 'User';

  // Empty state - centered layout like Claude
  if (!hasMessages) {
    return (
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-background p-6">
        <div className="w-full max-w-2xl flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 rounded-2xl shadow-lg shadow-violet-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-semibold text-foreground mb-2 text-center">
            What can I help you with?
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            I can manage your emails, calendar, and files.
          </p>

          {/* Input Box */}
          <div className="w-full mb-6">
            <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-muted-foreground/30 transition-all focus-within:shadow-md focus-within:border-violet-500/50">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder-muted-foreground text-base min-h-[28px] max-h-[120px] leading-7"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white disabled:opacity-40 shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s.text)}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm text-muted-foreground hover:bg-accent hover:border-muted-foreground/30 hover:text-foreground transition-all"
              >
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {s.text}
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground mt-8">
            AI may produce inaccurate information. Verify important details.
          </p>
        </div>
      </div>
    );
  }

  // Chat mode - messages with input at bottom
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-background">
      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="space-y-4">
            {messages.map((msg, idx) => {
              if (msg.role === "tool" || (msg.role as any) === "function") {
                return null;
              }

              const isUser = msg.role === "user";
              
              return (
                <div key={idx} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
                  {isUser ? (
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarFallback 
                        className="text-white text-xs font-medium"
                        style={{
                          background: user?.avatar_gradient_start && user?.avatar_gradient_end
                            ? `linear-gradient(135deg, ${user.avatar_gradient_start}, ${user.avatar_gradient_end})`
                            : 'linear-gradient(135deg, #8b5cf6, #d946ef)'
                        }}
                      >
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="w-8 h-8 shrink-0 bg-gray-800">
                      <AvatarFallback className="text-white text-xs font-medium bg-gray-800">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                    {msg.content && (
                      <div
                        className={`rounded-2xl px-4 py-2.5 ${
                          isUser
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 border border-border/50 text-foreground"
                        }`}
                      >
                        <div className={`prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 ${isUser ? "text-white [&>*]:text-white" : "text-foreground [&>*]:text-foreground"}`}>
                          <ReactMarkdown>
                            {msg.content as string}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {msg.tool_calls && (
                      <div className="w-full space-y-2">
                        {msg.tool_calls.map((call: any) => {
                          const toolResultMsg = messages.find(m => (m as any).tool_call_id === call.id);
                          const toolResultData = toolResultMsg ? JSON.parse(toolResultMsg.content || "{}") : null;

                          return (
                            <div key={call.id} className="bg-muted/30 border border-border/50 rounded-xl overflow-hidden">
                              <div className="px-3 py-2 bg-muted/50 border-b border-border/50 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs font-medium text-foreground/70">
                                  {call.function.name}
                                </span>
                              </div>
                              <div className="p-3">
                                {toolResultData ? (
                                  <ToolOutput toolName={call.function.name} data={toolResultData} />
                                ) : (
                                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Running...
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Inline Confirmation Bubble */}
            {pendingConfirmation && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0 bg-amber-600">
                  <AvatarFallback className="text-white text-xs font-medium bg-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl px-4 py-3">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                      {pendingConfirmation.summary}
                    </p>
                    
                    {/* List all pending tool calls */}
                    <div className="space-y-2 mb-3">
                      {pendingConfirmation.toolCalls.map((tc, idx) => (
                        <div key={tc.id} className="bg-amber-100/50 dark:bg-amber-900/30 rounded-lg p-2">
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                            {idx + 1}. {tc.toolName}
                          </p>
                          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">
                            {tc.description}
                          </p>
                          {Object.keys(tc.toolArgs).length > 0 && (
                            <details className="text-xs">
                              <summary className="cursor-pointer text-amber-500 dark:text-amber-500 hover:underline">
                                View parameters
                              </summary>
                              <pre className="mt-1 text-amber-700 dark:text-amber-300 overflow-auto max-h-20 bg-amber-50 dark:bg-amber-950/50 p-1 rounded">
                                {JSON.stringify(tc.toolArgs, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirm}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Yes, proceed
                      </Button>
                      <Button
                        onClick={handleCancel}
                        size="sm"
                        variant="outline"
                        className="border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isLoading && !pendingConfirmation && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 bg-gray-800">
                  <AvatarFallback className="text-white text-xs bg-gray-800">AI</AvatarFallback>
                </Avatar>
                <div className="bg-muted/50 border border-border/50 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border bg-card p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-muted border border-border rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              disabled={!!pendingConfirmation}
              className="flex-1 bg-transparent border-none outline-none resize-none text-foreground placeholder-muted-foreground text-sm min-h-[36px] max-h-[120px] py-1.5 leading-6 disabled:opacity-50"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMessages([])}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !!pendingConfirmation}
              size="icon"
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 hover:from-violet-600 hover:to-fuchsia-700 text-white disabled:opacity-40"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
