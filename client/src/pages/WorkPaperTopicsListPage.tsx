import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileText,
  Filter,
  List,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Loader2,
  Tag,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { Pagination } from "@/components/Pagination";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/utils/dateFormat";
import {
  workPaperTopicApi,
  WorkPaperTopic,
  CreateTopicRequest,
  UpdateTopicRequest,
} from "@/services/work-paper-topic-api";

export default function WorkPaperTopicsListPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [topics, setTopics] = useState<WorkPaperTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({
    count: 0,
    total_count: 0,
    current_page: 1,
    total_page: 1,
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<WorkPaperTopic | null>(null);
  const [deletingTopic, setDeletingTopic] = useState<WorkPaperTopic | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    is_active: boolean;
  }>({
    name: "",
    description: "",
    is_active: true,
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchTopics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await workPaperTopicApi.getTopics({
        page: currentPage,
        limit: limit,
        search: debouncedSearchTerm || undefined,
      });

      setTopics(response.data || []);
      setPagination({
        count: response.data?.length || 0,
        total_count: response.pagination?.total_items || 0,
        current_page: response.pagination?.page || currentPage,
        total_page: response.pagination?.total_pages || 1,
      });
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengambil data topics",
        variant: "destructive",
      });
      setTopics([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, debouncedSearchTerm, toast]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

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

  const openCreateModal = () => {
    setEditingTopic(null);
    setFormData({ name: "", description: "", is_active: true });
    setIsModalOpen(true);
  };

  const openEditModal = (topic: WorkPaperTopic) => {
    setEditingTopic(topic);
    setFormData({
      name: topic.name,
      description: topic.description || "",
      is_active: topic.is_active,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Nama topic harus diisi",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      if (editingTopic) {
        const updateData: UpdateTopicRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          is_active: formData.is_active,
        };
        await workPaperTopicApi.updateTopic(editingTopic.id, updateData);
        toast({
          title: "Success",
          description: "Topic berhasil diperbarui",
        });
      } else {
        const createData: CreateTopicRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };
        await workPaperTopicApi.createTopic(createData);
        toast({
          title: "Success",
          description: "Topic berhasil dibuat",
        });
      }
      setIsModalOpen(false);
      fetchTopics();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Gagal ${editingTopic ? "memperbarui" : "membuat"} topic`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingTopic) return;

    try {
      setDeleting(true);
      await workPaperTopicApi.deleteTopic(deletingTopic.id);
      toast({
        title: "Success",
        description: "Topic berhasil dihapus",
      });
      setIsDeleteDialogOpen(false);
      setDeletingTopic(null);
      fetchTopics();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal menghapus topic",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (topic: WorkPaperTopic) => {
    try {
      await workPaperTopicApi.updateTopic(topic.id, {
        name: topic.name,
        is_active: !topic.is_active,
      });
      toast({
        title: "Success",
        description: `Topic berhasil ${topic.is_active ? "dinonaktifkan" : "diaktifkan"}`,
      });
      fetchTopics();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengubah status topic",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px]">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-semibold text-gray-900">
            Work Paper Topics Management
          </span>
          <div className="h-4 w-px bg-gray-200" />
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-3.5 w-3.5" />
            <Input
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 h-8 text-xs bg-gray-50 border-gray-200 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">

          <Button
            onClick={openCreateModal}
            size="sm"
            className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Topic
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b">
              <TableHead className="pl-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("name")}
                >
                  Name
                  <span className="ml-2">{getSortIcon("name")}</span>
                </Button>
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                  onClick={() => handleSort("is_active")}
                >
                  Status
                  <span className="ml-2">{getSortIcon("is_active")}</span>
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
              <TableHead className="text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : topics.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <Tag className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                  <p>Tidak ada data topics</p>
                  {debouncedSearchTerm && (
                    <p className="text-sm">Coba kata kunci pencarian lain</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow
                  key={topic.id}
                  className="group hover:bg-gray-50/80 cursor-pointer transition-colors border-b"
                  onClick={() => setLocation(`/work-paper-topics/${topic.id}`)}
                >
                  <TableCell className="pl-6 font-medium">
                    <div className="flex items-center space-x-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="hover:text-blue-600 transition-colors">{topic.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 truncate max-w-[300px] block">
                      {topic.description || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={topic.is_active}
                        onCheckedChange={() => handleToggleActive(topic)}
                      />
                      <span
                        className={`text-xs font-medium ${
                          topic.is_active ? "text-green-600" : "text-gray-500"
                        }`}
                      >
                        {topic.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500">
                      {formatDateTime(topic.created_at)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(topic);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingTopic(topic);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="sticky bottom-0 bg-white z-10 flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t gap-4 mt-auto">
          <div className="text-xs text-muted-foreground order-2 sm:order-1">
            Showing <strong>{topics.length}</strong> of{" "}
            <strong>{pagination.total_count}</strong> topics
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

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTopic ? "Edit Topic" : "Create Topic"}
            </DialogTitle>
            <DialogDescription>
              {editingTopic
                ? "Perbarui informasi topic."
                : "Buat topic baru untuk work paper items."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Masukkan nama topic"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Deskripsi topic (opsional)"
                rows={3}
              />
            </div>
            {editingTopic && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Topic?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus topic "{deletingTopic?.name}"?
              Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
