import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  Save,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { apiClient } from "@/lib/api-client";
import { getApiBaseUrl } from "@/lib/env";
import { TopicSelector } from "@/components/TopicSelector";

interface WorkPaperItemDetail {
  id: string;
  type: string;
  number: string;
  topic_id?: string;
  expected_folder_name?: string;
  desk_instruction: string;
  level: number;
  sequence: number;
  is_active: boolean;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export default function WorkPaperItemDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params.id!;
  const isNew = id === "new";

  const [workPaperItem, setWorkPaperItem] =
    useState<WorkPaperItemDetail | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [formData, setFormData] = useState({
    number: "",
    type: "",
    topic_id: "",
    expected_folder_name: "",
    desk_instruction: "",
    level: 1,
    sequence: 1,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  // Read topic_id from URL query params when creating new item
  useEffect(() => {
    if (isNew) {
      const urlParams = new URLSearchParams(window.location.search);
      const topicIdFromUrl = urlParams.get("topic_id");
      if (topicIdFromUrl) {
        setFormData(prev => ({ ...prev, topic_id: topicIdFromUrl }));
      }
    }
  }, [isNew]);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", {
        locale: id as any,
      });
    } catch (error) {
      return "-";
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy, HH:mm", {
        locale: id as any,
      });
    } catch (error) {
      return "-";
    }
  };

  const getTypeBadge = (type: string) => {
    const typeConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      A: {
        bg: "bg-blue-100 hover:bg-blue-200",
        text: "text-blue-800",
        label: "Type A",
      },
      B: {
        bg: "bg-green-100 hover:bg-green-200",
        text: "text-green-800",
        label: "Type B",
      },
      C: {
        bg: "bg-purple-100 hover:bg-purple-200",
        text: "text-purple-800",
        label: "Type C",
      },
      Q: {
        bg: "bg-orange-100 hover:bg-orange-200",
        text: "text-orange-800",
        label: "Type Q",
      },
    };

    const config = typeConfig[type] || {
      bg: "bg-muted hover:bg-border",
      text: "text-foreground",
      label: `Type ${type}`,
    };

    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const fetchWorkPaperItemDetail = async () => {
    if (isNew) return;

    try {
      setLoading(true);

      const apiResponse: { data: WorkPaperItemDetail } =
        (await apiClient.getWorkPaperItem(id)) as { data: WorkPaperItemDetail };
      const result = apiResponse.data;

      setWorkPaperItem(result);
      setFormData({
        number: result.number,
        type: result.type,
        topic_id: result.topic_id || "",
        expected_folder_name: result.expected_folder_name || "",
        desk_instruction: result.desk_instruction,
        level: result.level,
        sequence: result.sequence,
        is_active: result.is_active,
      });
    } catch (error) {
      console.error("Error fetching work paper item detail:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data work paper item",
        variant: "destructive",
      });
      setLocation("/work-paper-items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkPaperItemDetail();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const url = isNew
        ? `${getApiBaseUrl()}/api/v1/desk/work-paper-items`
        : `${getApiBaseUrl()}/api/v1/desk/work-paper-items/${id}`;

      const method = isNew ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: formData.type,
          number: formData.number,
          topic_id: formData.topic_id || undefined,
          expected_folder_name: formData.expected_folder_name || undefined,
          desk_instruction: formData.desk_instruction,
          level: formData.level,
          sequence: formData.sequence,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error(`Gagal ${isNew ? 'membuat' : 'memperbarui'} work paper item: ${response.status}`);
      }

      if (isNew) {
        const responseData = await response.json();
        const newId = responseData.data?.id;
        if (newId) {
          setLocation(`/work-paper-items/${newId}`);
          toast({
            title: "Success",
            description: "Work Paper Item berhasil dibuat",
          });
        }
      } else {
        await fetchWorkPaperItemDetail();
        toast({
          title: "Success",
          description: "Work Paper Item berhasil diperbarui",
        });
      }
    } catch (error) {
      console.error("Error saving work paper item:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Gagal ${isNew ? 'membuat' : 'memperbarui'} work paper item`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-lg h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!workPaperItem && !isNew) {
    return (
      <div className="bg-background flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">Work Paper Item tidak ditemukan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-card z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/work-paper-items")}
            className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold text-foreground">
              {isNew ? "New Work Paper Item" : "Edit Work Paper Item"}
            </span>
          </div>

          {!isNew && workPaperItem && (
            <>
              <div className="h-4 w-px bg-border" />
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {workPaperItem.number}
              </span>
              {getTypeBadge(workPaperItem.type)}
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
            className="h-9 text-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="w-full space-y-6">
          {/* Basic Info Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {!isNew && (
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      ID
                    </Label>
                    <p className="text-sm mt-1 font-mono bg-muted px-3 py-2 rounded-md">
                      {workPaperItem?.id}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Nomor <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    className="mt-1"
                    placeholder="Masukkan nomor"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipe <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm bg-card focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Tipe</option>
                    <option value="A">Type A</option>
                    <option value="B">Type B</option>
                    <option value="C">Type C</option>
                    <option value="Q">Type Q</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Topic
                  </Label>
                  <TopicSelector
                    value={formData.topic_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, topic_id: value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Expected Folder Name for Smart Document Linking */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-medium text-foreground">Smart Document Linking</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Expected Folder Name
                    </Label>
                    <Input
                      value={formData.expected_folder_name}
                      onChange={(e) =>
                        setFormData({ ...formData, expected_folder_name: e.target.value })
                      }
                      className="mt-1 font-mono"
                      placeholder="Eksistensi_LK"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nama folder di Google Drive yang akan di-link otomatis saat sync
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Level
                  </Label>
                  <Input
                    type="number"
                    value={formData.level}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        level: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1"
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Sequence
                  </Label>
                  <Input
                    type="number"
                    value={formData.sequence}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sequence: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1"
                    min="1"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </Label>
                  <div className="mt-2 flex items-center space-x-2 h-9">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_active: e.target.checked,
                        })
                      }
                      className="h-4 w-4 text-primary focus:ring-blue-500 border-border rounded"
                    />
                    <Label
                      htmlFor="is_active"
                      className="text-sm text-foreground cursor-pointer"
                    >
                      Active
                    </Label>
                  </div>
                </div>
              </div>

              {!isNew && workPaperItem?.parent_id && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Parent ID
                  </Label>
                  <div className="flex items-center space-x-1 mt-1">
                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-mono">
                      {workPaperItem.parent_id}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Desk Instruction Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Desk Instruction</span>
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Instruksi yang akan dikirim sebagai prompt ke LLM untuk proses desk.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.desk_instruction}
                onChange={(e) =>
                  setFormData({ ...formData, desk_instruction: e.target.value })
                }
                placeholder="Masukkan desk instruction..."
                rows={8}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
