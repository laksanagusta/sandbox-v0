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

interface WorkPaperItemDetail {
  id: string;
  type: string;
  number: string;
  statement: string;
  explanation: string;
  filling_guide: string;
  level: number;
  sort_order: number;
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

  const [workPaperItem, setWorkPaperItem] =
    useState<WorkPaperItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    number: "",
    type: "",
    statement: "",
    explanation: "",
    filling_guide: "",
    level: 1,
    sort_order: 1,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

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
      bg: "bg-gray-100 hover:bg-gray-200",
      text: "text-gray-800",
      label: `Type ${type}`,
    };

    return (
      <Badge className={`${config.bg} ${config.text} border-0`}>
        {config.label}
      </Badge>
    );
  };

  const fetchWorkPaperItemDetail = async () => {
    try {
      setLoading(true);

      const apiResponse: { data: WorkPaperItemDetail } =
        (await apiClient.getWorkPaperItem(id)) as { data: WorkPaperItemDetail };
      const result = apiResponse.data;

      setWorkPaperItem(result);
      setFormData({
        number: result.number,
        type: result.type,
        statement: result.statement,
        explanation: result.explanation,
        filling_guide: result.filling_guide,
        level: result.level,
        sort_order: result.sort_order,
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

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/v1/desk/work-paper-items/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            type: formData.type,
            number: formData.number,
            statement: formData.statement,
            explanation: formData.explanation,
            filling_guide: formData.filling_guide,
            level: formData.level,
            sort_order: formData.sort_order,
            is_active: formData.is_active,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal menyimpan perubahan: ${response.status}`);
      }

      await fetchWorkPaperItemDetail();
      toast({
        title: "Success",
        description: "Work Paper Item berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error saving work paper item:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal menyimpan perubahan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workPaperItem) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p>Work Paper Item tidak ditemukan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setLocation("/work-paper-items")}
                className="flex items-center space-x-2 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </Button>
              <div className="flex items-center space-x-3">
                <FileText className="w-8 h-8 text-gray-600" />
                <div>
                  <h1 className="text-2xl font-semibold">
                    Detail Work Paper Item
                  </h1>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Menyimpan..." : "Simpan"}</span>
              </Button>
            </div>
          </div>

          {/* Detail Kegiatan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Detail Work Paper Item</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    ID
                  </Label>
                  <p className="text-sm mt-1 font-mono bg-gray-50 px-2 py-1 rounded">
                    {workPaperItem.id}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Nomor
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
                  <Label className="text-sm font-medium text-gray-700">
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
                  <Label className="text-sm font-medium text-gray-700">
                    Sort Order
                  </Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        sort_order: parseInt(e.target.value) || 1,
                      })
                    }
                    className="mt-1"
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Tipe
                  </Label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        type: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="A">Type A</option>
                    <option value="B">Type B</option>
                    <option value="C">Type C</option>
                    <option value="Q">Type Q</option>
                  </select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Status
                  </Label>
                  <div className="mt-2 flex items-center space-x-2">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label
                      htmlFor="is_active"
                      className="text-sm text-gray-700"
                    >
                      Active
                    </Label>
                  </div>
                </div>
              </div>

              {workPaperItem.parent_id && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">
                    Parent ID
                  </Label>
                  <div className="flex items-center space-x-1 mt-1">
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {workPaperItem.parent_id}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Statement
                </Label>
                <Textarea
                  value={formData.statement}
                  onChange={(e) =>
                    setFormData({ ...formData, statement: e.target.value })
                  }
                  placeholder="Masukkan statement"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Explanation
                </Label>
                <Textarea
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  placeholder="Masukkan explanation"
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Filling Guide
                </Label>
                <Textarea
                  value={formData.filling_guide}
                  onChange={(e) =>
                    setFormData({ ...formData, filling_guide: e.target.value })
                  }
                  placeholder="Masukkan filling guide (opsional)"
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
