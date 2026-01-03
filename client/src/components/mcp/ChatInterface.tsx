import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initializeOpenAI, sendMessage, Message } from "@/lib/mcp/openai-client";
import { ToolOutput } from "./ToolOutput";
import { Loader2, Send, Sparkles, Mail, Calendar, FolderOpen, RotateCcw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/hooks/use-auth";

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey) {
      initializeOpenAI(envKey);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-gradient-to-b from-slate-50 via-white to-slate-50 p-6">
        <div className="w-full max-w-2xl flex flex-col items-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="bg-gradient-to-br from-violet-500 to-fuchsia-600 p-4 rounded-2xl shadow-lg shadow-violet-200">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-2 text-center">
            What can I help you with?
          </h1>
          <p className="text-gray-500 text-center mb-8">
            I can manage your emails, calendar, and files.
          </p>

          {/* Input Box */}
          <div className="w-full mb-6">
            <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all focus-within:shadow-md focus-within:border-violet-300">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything..."
                rows={1}
                className="flex-1 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-400 text-base min-h-[28px] max-h-[120px] leading-7"
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
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900 transition-all"
              >
                <s.icon className={`w-4 h-4 ${s.color}`} />
                {s.text}
              </button>
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 mt-8">
            AI may produce inaccurate information. Verify important details.
          </p>
        </div>
      </div>
    );
  }

  // Chat mode - messages with input at bottom
  return (
    <div className="h-[calc(100vh-64px)] flex flex-col bg-slate-50">
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
                            ? "bg-gray-900 text-white"
                            : "bg-white border border-gray-200 text-gray-900"
                        }`}
                      >
                        <div className={`prose prose-sm max-w-none [&>p]:m-0 ${isUser ? "text-white [&>*]:text-white" : ""}`}>
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
                            <div key={call.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-xs font-medium text-gray-500">
                                  {call.function.name}
                                </span>
                              </div>
                              <div className="p-3">
                                {toolResultData ? (
                                  <ToolOutput toolName={call.function.name} data={toolResultData} />
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-400 text-sm">
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
            
            {isLoading && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 bg-gray-800">
                  <AvatarFallback className="text-white text-xs bg-gray-800">AI</AvatarFallback>
                </Avatar>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              className="flex-1 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-400 text-sm min-h-[36px] max-h-[120px] py-1.5 leading-6"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMessages([])}
              className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
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
