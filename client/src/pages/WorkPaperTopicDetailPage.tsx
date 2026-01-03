import { useParams, useLocation } from "wouter";
import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Tag,
  FileText,
  Plus,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  User,
  Pencil,
  Loader2,
  Save,
  List,
  Info,
  Upload,
  Download,
  Trash2,
  FileSpreadsheet,
  AlertTriangle,
  GripVertical,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/utils/dateFormat";
import {
  workPaperTopicApi,
  WorkPaperTopic,
  UpdateTopicRequest,
} from "@/services/work-paper-topic-api";
import { apiClient } from "@/lib/api-client";
import { getApiBaseUrl } from "@/lib/env";

interface WorkPaperItem {
  id: string;
  type: string;
  number: string;
  topic_id?: string;
  topic_name?: string;
  expected_folder_name?: string;
  desk_instruction: string;
  level: number;
  sequence: number;
  is_active: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

interface WorkPaperItemResponse {
  data: WorkPaperItem[];
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export default function WorkPaperTopicDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params.id!;

  // Topic state
  const [topic, setTopic] = useState<WorkPaperTopic | null>(null);
  const [loadingTopic, setLoadingTopic] = useState(true);

  // Edit topic state
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Items state
  const [items, setItems] = useState<WorkPaperItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("sequence");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({
    count: 0,
    total_count: 0,
    current_page: 1,
    total_page: 1,
  });

  // Create item modal state
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false);
  const [createItemFormData, setCreateItemFormData] = useState({
    number: "",
    type: "A",
    level: 1,
    sequence: 1,
    expected_folder_name: "",
    desk_instruction: "",
  });
  const [savingItem, setSavingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<WorkPaperItem | null>(null);
  const [draggedItem, setDraggedItem] = useState<WorkPaperItem | null>(null);

  // Template state
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [isDeleteTemplateDialogOpen, setIsDeleteTemplateDialogOpen] = useState(false);

  // Fetch topic detail
  const fetchTopic = useCallback(async () => {
    try {
      setLoadingTopic(true);
      const response = await workPaperTopicApi.getTopic(id);
      setTopic(response.data);
    } catch (error) {
      console.error("Error fetching topic:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengambil data topic",
        variant: "destructive",
      });
      setLocation("/work-paper-topics");
    } finally {
      setLoadingTopic(false);
    }
  }, [id, toast, setLocation]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch items filtered by topic_id
  const fetchItems = useCallback(async () => {
    try {
      setLoadingItems(true);
      const params: any = {
        page: currentPage,
        limit: limit,
        topic_id: id,
      };

      if (debouncedSearchTerm.trim()) {
        params.search = debouncedSearchTerm.trim();
      }

      if (sortField && sortOrder) {
        params.sort = `${sortField} ${sortOrder}`;
      }

      const response = (await apiClient.getWorkPaperItems(params)) as WorkPaperItemResponse;
      setItems(response.data || []);
      setPagination({
        count: response.data?.length || 0,
        total_count: response.total_items || 0,
        current_page: response.page || currentPage,
        total_page: response.total_pages || 1,
      });
    } catch (error) {
      console.error("Error fetching items:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengambil data items",
        variant: "destructive",
      });
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }, [id, currentPage, limit, debouncedSearchTerm, sortField, sortOrder, toast]);

  useEffect(() => {
    fetchTopic();
  }, [fetchTopic]);

  useEffect(() => {
    if (topic) {
      fetchItems();
      // Initialize edit form data
      setEditFormData({
        name: topic.name,
        description: topic.description || "",
        is_active: topic.is_active,
      });
      setIsDirty(false);
    }
  }, [topic, fetchItems]);

  const handleInputChange = (field: string, value: any) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSaveTopic = async () => {
    if (!editFormData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama topic harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const updateData: UpdateTopicRequest = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        is_active: editFormData.is_active,
      };
      await workPaperTopicApi.updateTopic(id, updateData);
      toast({
        title: "Success",
        description: "Topic berhasil diperbarui",
      });
      setIsDirty(false);
      fetchTopic();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal memperbarui topic",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 text-blue-600" />
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { bg: string; text: string; label: string }> = {
      A: { bg: "bg-blue-100", text: "text-blue-800", label: "Type A" },
      B: { bg: "bg-green-100", text: "text-green-800", label: "Type B" },
      C: { bg: "bg-purple-100", text: "text-purple-800", label: "Type C" },
      Q: { bg: "bg-orange-100", text: "text-orange-800", label: "Type Q" },
    };
    const config = typeConfig[type] || { bg: "bg-gray-100", text: "text-gray-800", label: `Type ${type}` };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const handleCreateItem = () => {
    // Reset form and open modal
    setEditingItem(null);
    setCreateItemFormData({
      number: "",
      type: "A",
      level: 1,
      sequence: 1,
      expected_folder_name: "",
      desk_instruction: "",
    });
    setIsCreateItemModalOpen(true);
  };

  const handleEditItem = (item: WorkPaperItem) => {
    setEditingItem(item);
    setCreateItemFormData({
      number: item.number,
      type: item.type,
      level: item.level,
      sequence: item.sequence,
      expected_folder_name: item.expected_folder_name || "",
      desk_instruction: item.desk_instruction || "",
    });
    setIsCreateItemModalOpen(true);
  };

  // Template handlers
  const handleUploadTemplate = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
      toast({
        title: "Error",
        description: "Hanya file Excel (.xlsx, .xls) yang diperbolehkan",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Ukuran file maksimal 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingTemplate(true);
      await workPaperTopicApi.uploadTopicTemplate(id, file);
      toast({
        title: "Success",
        description: "Template berhasil diupload",
      });
      fetchTopic();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengupload template",
        variant: "destructive",
      });
    } finally {
      setUploadingTemplate(false);
      // Reset input
      event.target.value = "";
    }
  };

  const handleDownloadTemplate = async () => {
    if (!topic?.template_path) return;

    try {
      setDownloadingTemplate(true);
      const blob = await workPaperTopicApi.downloadTopicTemplate(id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from template_path or use default
      const filename = topic.template_path.split('/').pop() || `template_${topic.name}.xlsx`;
      link.download = filename;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Template berhasil didownload",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengdownload template",
        variant: "destructive",
      });
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDeleteTemplate = async () => {
    try {
      setDeletingTemplate(true);
      await workPaperTopicApi.deleteTopicTemplate(id);
      toast({
        title: "Success",
        description: "Template berhasil dihapus",
      });
      setIsDeleteTemplateDialogOpen(false);
      fetchTopic();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal menghapus template",
        variant: "destructive",
      });
    } finally {
      setDeletingTemplate(false);
    }
  };

  const handleSaveItem = async () => {
    if (!createItemFormData.number.trim()) {
      toast({
        title: "Error",
        description: "Nomor item harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setSavingItem(true);
      const token = localStorage.getItem("auth_token");
      
      const url = editingItem 
        ? `${getApiBaseUrl()}/api/v1/desk/work-paper-items/${editingItem.id}` 
        : `${getApiBaseUrl()}/api/v1/desk/work-paper-items`;
        
      const method = editingItem ? "PUT" : "POST";

      const body: any = {
        type: createItemFormData.type,
        number: createItemFormData.number.trim(),
        topic_id: id,
        expected_folder_name: createItemFormData.expected_folder_name.trim() || undefined,
        desk_instruction: createItemFormData.desk_instruction.trim(),
        level: createItemFormData.level,
        is_active: true,
      };

      if (editingItem) {
        body.sequence = createItemFormData.sequence;
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Gagal ${editingItem ? 'mengupdate' : 'membuat'} item`);
      }

      toast({
        title: "Success",
        description: `Item berhasil ${editingItem ? 'diperbarui' : 'dibuat'}`,
      });
      setIsCreateItemModalOpen(false);
      fetchItems();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Gagal ${editingItem ? 'mengupdate' : 'membuat'} item`,
        variant: "destructive",
      });
    } finally {
      setSavingItem(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, item: WorkPaperItem) => {
    if (sortField !== "sequence") return;
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    // Optional: Set a custom drag image or styling
    if (e.currentTarget instanceof HTMLElement) {
       e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
       e.currentTarget.style.opacity = '';
    }
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (sortField !== "sequence") return;
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetItem: WorkPaperItem) => {
    e.preventDefault();
    if (e.currentTarget instanceof HTMLElement) {
       e.currentTarget.style.opacity = '';
    }
    
    if (!draggedItem || draggedItem.id === targetItem.id) return;
    if (sortField !== "sequence") return;

    // Calculate new order
    const currentIndex = items.findIndex((i) => i.id === draggedItem.id);
    const targetIndex = items.findIndex((i) => i.id === targetItem.id);
    
    if (currentIndex === -1 || targetIndex === -1) return;

    const newItems = [...items];
    const [movedItem] = newItems.splice(currentIndex, 1);
    newItems.splice(targetIndex, 0, movedItem);

    // Update sequences 
    // Assuming backend handles sequence uniqueness or we just update all affected
    // We re-normalize sequences to be 1-based index
    const updatedItems = newItems.map((item, index) => ({
      ...item,
      sequence: index + 1,
    }));

    // Optimistic update
    setItems(updatedItems);
    setDraggedItem(null);

    // API Update for changed items
    try {
      const token = localStorage.getItem("auth_token");
      const updates = updatedItems.filter((item) => {
        const oldItem = items.find((i) => i.id === item.id);
        return oldItem && oldItem.sequence !== item.sequence;
      });

      if (updates.length > 0) {
        await Promise.all(
          updates.map((item) =>
            fetch(`${getApiBaseUrl()}/api/v1/desk/work-paper-items/${item.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(item),
            })
          )
        );
        toast({
          title: "Success",
          description: "Urutan item berhasil diperbarui",
        });
      }
    } catch (error) {
      console.error("Failed to update sequence:", error);
      toast({
        title: "Error",
        description: "Gagal menyimpan urutan item",
        variant: "destructive",
      });
      fetchItems(); // Revert on error
    }
  };

  if (loadingTopic) {
    return (
      <div className="bg-white flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="bg-white flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Topic tidak ditemukan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-white z-10">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/work-paper-topics")}
            className="p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Button>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              {topic.name}
            </span>
          </div>

          <Badge
            className={`${
              topic.is_active
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-800"
            } border-0`}
          >
            {topic.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreateItem}
            size="sm"
            className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        {/* Topic Info Card */}
        <div className="p-6 pb-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4" />
                <span>Informasi Dasar</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="topic-name" className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Nama Topic <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="topic-name"
                      value={editFormData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Masukkan nama topic"
                      className="max-w-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="is-active" className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Status
                    </Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        id="is-active"
                        checked={editFormData.is_active}
                        onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                      />
                      <Label htmlFor="is-active" className="font-normal cursor-pointer">
                        {editFormData.is_active ? "Active" : "Inactive"}
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="topic-desc" className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5 block">
                    Description
                  </Label>
                  <Textarea
                    id="topic-desc"
                    value={editFormData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Deskripsi topic (opsional)"
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Deskripsi ini akan membantu memberikan konteks pada penggunaan topic.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50/50 border-t py-3 flex justify-end">
              <Button 
                onClick={handleSaveTopic} 
                disabled={saving || !isDirty} 
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3" />
                    Simpan
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Template Card */}
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Template Kertas Kerja</span>
                    {topic.template_version > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        v{topic.template_version}
                      </Badge>
                    )}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topic.template_path ? (
                  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <FileSpreadsheet className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {topic.template_path.split('/').pop()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Version {topic.template_version}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        disabled={downloadingTemplate}
                        className="h-8 border-primary/20 text-primary hover:bg-primary/10 hover:text-primary"
                      >
                        {downloadingTemplate ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                        <span className="ml-2">Download</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsDeleteTemplateDialogOpen(true)}
                        disabled={deletingTemplate}
                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-100/50 transition-colors">
                    <div className="text-center max-w-sm">
                      <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                        <FileSpreadsheet className="mx-auto h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-1">
                        Belum ada template referensi
                      </h3>
                      <p className="text-xs text-gray-500 mb-4 px-4 leading-relaxed">
                        Upload file Excel (.xlsx) yang sudah diformat sebagai acuan baku bagi auditor saat mengerjakan kertas kerja topik ini.
                      </p>
                    </div>
                  </div>
                )}

                {/* Upload Section */}
                <div className="pt-2 border-t mt-4">
                  <Label htmlFor="template-upload" className="flex justify-between items-center text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    <span>{topic.template_path ? "Perbarui File Template" : "Upload File"}</span>
                    {topic.template_path && <span className="text-xs text-gray-400 font-normal">File sebelumnya akan ditimpa</span>}
                  </Label>
                  <div className="mt-2">
                    <label
                      htmlFor="template-upload"
                      className={`flex items-center justify-center w-full px-4 py-3 border border-dashed rounded-lg cursor-pointer transition-all ${
                        uploadingTemplate
                          ? "bg-gray-50 border-gray-300 cursor-not-allowed"
                          : "border-gray-300 hover:bg-primary/5 hover:border-primary/30"
                      }`}
                    >
                      {uploadingTemplate ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          <span className="text-sm text-primary">Mengupload...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 text-primary" />
                          <span className="text-sm text-primary">
                            {topic.template_path ? "Pilih file untuk mengganti template" : "Pilih file Excel untuk upload"}
                          </span>
                        </>
                      )}
                    </label>
                    <input
                      id="template-upload"
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleUploadTemplate}
                      disabled={uploadingTemplate}
                      className="hidden"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Maksimal 10MB, format .xlsx atau .xls</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Items Table */}
        <div className="px-6 pb-6 mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Struktur Operasional</h2>
            <p className="text-sm text-gray-500">
              Bagian ini mengatur logika dan item penilaian sebenarnya yang akan muncul di sistem.
            </p>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <CardTitle className="text-base font-semibold flex items-center space-x-2">
                  <List className="w-4 h-4" />
                  <span>Struktur Item Penilaian</span>
                  <Badge variant="secondary" className="ml-2">
                    {pagination.total_count} items
                  </Badge>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                    />
                  </div>

                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="pl-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("number")}
                      >
                        No
                        <span className="ml-2">{getSortIcon("number")}</span>
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("type")}
                      >
                        Type
                        <span className="ml-2">{getSortIcon("type")}</span>
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("sequence")}
                      >
                        Sequence
                        <span className="ml-2">{getSortIcon("sequence")}</span>
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("level")}
                      >
                        Level
                        <span className="ml-2">{getSortIcon("level")}</span>
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                        onClick={() => handleSort("created_at")}
                      >
                        Created
                        <span className="ml-2">{getSortIcon("created_at")}</span>
                      </Button>
                    </TableHead>
                    <TableHead>Expected Folder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingItems ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                          <span>Loading...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        <FileText className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                        <p>Belum ada items untuk topic ini</p>
                        <Button
                          onClick={handleCreateItem}
                          variant="link"
                          size="sm"
                          className="mt-2"
                        >
                          <Plus className="h-4 w-4" />
                          Tambah item pertama
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (

                      <TableRow
                        key={item.id}
                        className={`group hover:bg-gray-50/80 cursor-pointer transition-colors border-b ${
                          draggedItem?.id === item.id ? "opacity-50 bg-gray-50" : ""
                        }`}
                        onClick={() => handleEditItem(item)}
                        draggable={sortField === "sequence"}
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={handleDragEnd}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, item)}
                      >
                        <TableCell className="w-[50px] text-center">
                          {sortField === "sequence" && (
                            <div 
                              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="pl-6">
                          <div className="flex items-center space-x-2">
                            {item.parent_id && <ChevronRight className="h-3 w-3 text-gray-400" />}
                            <span className="text-sm font-medium">{item.number}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(item.type)}</TableCell>
                        <TableCell>
                          <span className="text-sm">{item.sequence}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">Level {item.level}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {formatDateTime(item.created_at)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.expected_folder_name ? (
                            <div className="flex items-center gap-1.5">
                              <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                              <span className="text-xs font-mono text-gray-700">
                                {item.expected_folder_name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {!loadingItems && items.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4">
                  <div className="text-xs text-muted-foreground order-2 sm:order-1">
                    Showing <strong>{items.length}</strong> of{" "}
                    <strong>{pagination.total_count}</strong> items
                  </div>

                  <div className="flex items-center space-x-6 order-1 sm:order-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Rows per page</span>
                      <Select
                        value={limit.toString()}
                        onValueChange={(value) => {
                          setLimit(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue placeholder={limit.toString()} />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[20, 50, 100].map((pageSize) => (
                            <SelectItem key={pageSize} value={pageSize.toString()}>
                              {pageSize}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {pagination.total_page > 1 && (
                      <Pagination
                        currentPage={pagination.current_page}
                        totalPages={pagination.total_page}
                        onPageChange={setCurrentPage}
                      />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
      </div>


      {/* Create Item Modal */}
      <Dialog open={isCreateItemModalOpen} onOpenChange={setIsCreateItemModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Tambah Item Baru"}</DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Perbarui informasi item work paper ini" 
                : `Buat item baru untuk topic "${topic.name}".`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item_number">
                  Nomor <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="item_number"
                  value={createItemFormData.number}
                  onChange={(e) =>
                    setCreateItemFormData({ ...createItemFormData, number: e.target.value })
                  }
                  placeholder="Contoh: 1.1"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="item_type">Type</Label>
                <Select
                  value={createItemFormData.type}
                  onValueChange={(value) =>
                    setCreateItemFormData({ ...createItemFormData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Type A</SelectItem>
                    <SelectItem value="B">Type B</SelectItem>
                    <SelectItem value="C">Type C</SelectItem>
                    <SelectItem value="Q">Type Q</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="item_level">Level</Label>
                <Input
                  id="item_level"
                  type="number"
                  value={createItemFormData.level}
                  onChange={(e) =>
                    setCreateItemFormData({
                      ...createItemFormData,
                      level: parseInt(e.target.value) || 1,
                    })
                  }
                  min="1"
                />
              </div>

              {editingItem && (
                <div className="grid gap-2">
                  <Label htmlFor="item_sequence">Sequence</Label>
                  <Input
                    id="item_sequence"
                    type="number"
                    value={createItemFormData.sequence}
                    onChange={(e) =>
                      setCreateItemFormData({
                        ...createItemFormData,
                        sequence: parseInt(e.target.value) || 1,
                      })
                    }
                    min="1"
                  />
                </div>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item_expected_folder_name" className="flex items-center gap-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-amber-600" />
                Expected Folder Name
              </Label>
              <Input
                id="item_expected_folder_name"
                value={createItemFormData.expected_folder_name}
                onChange={(e) =>
                  setCreateItemFormData({ ...createItemFormData, expected_folder_name: e.target.value })
                }
                placeholder="Eksistensi_LK"
                className="font-mono"
              />
              <p className="text-xs text-gray-400">
                Nama folder di Google Drive yang akan di-match saat sync
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="item_desk_instruction">Desk Instruction</Label>
              <Textarea
                id="item_desk_instruction"
                value={createItemFormData.desk_instruction}
                onChange={(e) =>
                  setCreateItemFormData({ ...createItemFormData, desk_instruction: e.target.value })
                }
                placeholder="Instruksi untuk AI/desk (opsional)"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateItemModalOpen(false)}
              disabled={savingItem}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveItem} disabled={savingItem}>
              {savingItem ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {editingItem ? "Update Item" : "Create Item"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Template Confirmation Dialog */}
      <AlertDialog open={isDeleteTemplateDialogOpen} onOpenChange={setIsDeleteTemplateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span>Hapus Template</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus template Excel ini? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingTemplate}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTemplate}
              disabled={deletingTemplate}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deletingTemplate ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Hapus Template
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
