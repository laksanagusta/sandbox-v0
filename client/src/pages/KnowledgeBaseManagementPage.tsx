import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { chatbotApi } from "@/services/chatbot-api";
import {
  KnowledgeBase,
  KnowledgeBaseDocument,
} from "../../../shared/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Database,
  Plus,
  Upload,
  FileText,
  Trash2,
  Loader2,
  FileUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

// File type configurations
const ALLOWED_FILE_TYPES = {
  "application/pdf": ".pdf",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "text/markdown": ".md",
  "application/json": ".json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const variants: Record<string, { className: string; icon: React.ReactNode }> = {
    active: {
      className: "bg-green-100 text-green-700 border-green-200",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    processing: {
      className: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: <Clock className="w-3 h-3 animate-spin" />,
    },
    failed: {
      className: "bg-red-100 text-red-700 border-red-200",
      icon: <AlertCircle className="w-3 h-3" />,
    },
  };

  const variant = variants[status] || variants.processing;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 text-xs", variant.className)}
    >
      {variant.icon}
      {status}
    </Badge>
  );
};

// File Upload Zone Component
const FileUploadZone = ({
  onUpload,
  isUploading,
  uploadProgress,
}: {
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  uploadProgress: number;
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files).filter(
        (file) => file.type in ALLOWED_FILE_TYPES
      );
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onUpload(files);
      }
    },
    [onUpload]
  );

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/30",
        isUploading && "pointer-events-none"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={Object.values(ALLOWED_FILE_TYPES).join(",")}
        className="hidden"
        onChange={handleFileSelect}
      />
      {isUploading ? (
        <div className="space-y-3">
          <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin" />
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      ) : (
        <>
          <FileUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-muted-foreground">
            PDF, TXT, CSV, Markdown, JSON, DOCX
          </p>
        </>
      )}
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
  <div className="flex flex-col items-center justify-center h-64 text-center p-8">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Icon className="w-8 h-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
    {action}
  </div>
);

// Knowledge Base Card Component
const KnowledgeBaseCard = ({
  kb,
  onUpload,
  onDelete,
  isSelected,
  onSelect,
}: {
  kb: KnowledgeBase;
  onUpload: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { data: kbDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["knowledge-base", kb.id],
    queryFn: () => chatbotApi.getKnowledgeBase(kb.id),
    enabled: isSelected,
  });

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{kb.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                Created {formatDate(kb.created_at)}
              </p>
            </div>
          </div>
          {kb.is_global && (
            <Badge variant="secondary" className="text-xs">
              Global
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            {kb.total_files} files
          </span>
          <span>{formatBytes(kb.total_bytes)}</span>
        </div>

        {isSelected && (
          <div className="space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Documents</span>
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onUpload(); }}>
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
            
            {isLoadingDetail ? (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : kbDetail?.data?.documents?.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-2">
                No documents uploaded yet
              </p>
            ) : (
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {kbDetail?.data?.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="text-sm text-foreground truncate">
                          {doc.file_name}
                        </span>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="flex justify-end pt-2 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Knowledge Base?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{kb.name}" and all its
                      documents. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive hover:bg-destructive/90"
                      onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Knowledge Base Management Page Component
export default function KnowledgeBaseManagementPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedKBId, setSelectedKBId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newKnowledgeBaseName, setNewKnowledgeBaseName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Check if user is Super Admin
  const isSuperAdmin = user?.roles?.some(role => role.name === "Super Admin") ?? false;

  // Queries
  const { data: knowledgeBases, isLoading: isLoadingKBs } = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: () => chatbotApi.getKnowledgeBases(),
  });

  // Mutations
  const createKnowledgeBaseMutation = useMutation({
    mutationFn: (name: string) => chatbotApi.createKnowledgeBase(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      setNewKnowledgeBaseName("");
      setShowCreateDialog(false);
      toast({
        title: "Knowledge Base Created",
        description: "Your new knowledge base is ready for documents.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("super admin") 
          ? "Only Super Admin can create knowledge bases"
          : error.message,
        variant: "destructive",
      });
    },
  });

  const deleteKnowledgeBaseMutation = useMutation({
    mutationFn: (id: string) => chatbotApi.deleteKnowledgeBase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      setSelectedKBId(null);
      toast({
        title: "Knowledge Base Deleted",
        description: "The knowledge base and all its documents have been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message.includes("super admin")
          ? "Only Super Admin can delete knowledge bases"
          : error.message,
        variant: "destructive",
      });
    },
  });

  // Handlers
  const handleUploadFiles = async (files: File[]) => {
    if (!selectedKBId) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await chatbotApi.uploadFiles(
        selectedKBId,
        files,
        setUploadProgress
      );
      queryClient.invalidateQueries({
        queryKey: ["knowledge-base", selectedKBId],
      });
      queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      setShowUploadDialog(false);
      toast({
        title: "Files Uploaded",
        description: `Successfully uploaded ${files.length} file(s).`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description:
          error instanceof Error 
            ? error.message.includes("super admin")
              ? "Only Super Admin can upload files"
              : error.message
            : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // If not Super Admin, show unauthorized message
  if (!isSuperAdmin) {
    return (
      <div className="bg-white flex flex-col h-screen overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-white z-10">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              Knowledge Base Management
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-gray-50/50">
          <EmptyState
            icon={Database}
            title="Access Restricted"
            description="Only Super Admin users can manage knowledge bases. Please contact your administrator if you need access."
            action={
              <Link href="/chatbot">
                <Button variant="outline">Go to Chat</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-white z-10">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">
            Knowledge Base Management
          </span>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Knowledge Base
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Knowledge Base</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Knowledge base name..."
                value={newKnowledgeBaseName}
                onChange={(e) => setNewKnowledgeBaseName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newKnowledgeBaseName.trim()) {
                    createKnowledgeBaseMutation.mutate(
                      newKnowledgeBaseName.trim()
                    );
                  }
                }}
              />
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button
                  onClick={() =>
                    createKnowledgeBaseMutation.mutate(
                      newKnowledgeBaseName.trim()
                    )
                  }
                  disabled={
                    !newKnowledgeBaseName.trim() ||
                    createKnowledgeBaseMutation.isPending
                  }
                >
                  {createKnowledgeBaseMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
        {isLoadingKBs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : knowledgeBases?.data?.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No Knowledge Bases"
            description="Create your first knowledge base to start uploading documents and enable AI-powered chat."
            action={
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Knowledge Base
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {knowledgeBases?.data?.map((kb) => (
              <KnowledgeBaseCard
                key={kb.id}
                kb={kb}
                isSelected={selectedKBId === kb.id}
                onSelect={() => setSelectedKBId(selectedKBId === kb.id ? null : kb.id)}
                onUpload={() => setShowUploadDialog(true)}
                onDelete={() => deleteKnowledgeBaseMutation.mutate(kb.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Documents</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <FileUploadZone
              onUpload={handleUploadFiles}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
