import { useParams, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  FileText,
  MapPin,
  Calendar,
  User,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit,
  Save,
  X,
  Sparkles,
  MessageSquare,
  ChevronDown,
  MoreHorizontal,
  PenTool,
  Download,
  ExternalLink,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SourceFolderConfig, SyncFolderResult } from "@/components/SourceFolderConfig";
import { SyncResultModal } from "@/components/SyncResultModal";
import { FileStatusBadge, FileStatus } from "@/components/FileStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { formatDate, formatDateTime, getSignedAtTimestamp } from "@/utils/dateFormat";
import { OrganizationBadge } from "@/components/OrganizationBadge";
import { getApiBaseUrl } from "@/lib/env";

export type WorkPaperStatus =
  | "draft"
  | "ongoing"
  | "ready_to_sign"
  | "completed";

interface WorkPaperDetail {
  id: string;
  np_waper: string;
  organization_id: string;
  year: number;
  semester: number;
  status: WorkPaperStatus;
  source_folder_link?: string;
  last_folder_sync_at?: string;
  created_at: string;
  updated_at: string;
  work_paper_notes?: WorkPaperNote[];
  komentar_reviewer?: string;
  komentar_approver?: string;
  audit_trail?: Array<{
    id: string;
    action: string;
    action_by: string;
    old_value?: string;
    new_value?: string;
    created_at: string;
  }>;
}

interface MasterItem {
  id: string;
  type: string;
  number: string;
  desk_instruction: string;
  expected_folder_name?: string;
}

interface WorkPaperNote {
  id: string;
  work_paper_id: string;
  master_item_id: string;
  classification?: string;
  desk_instruction: string;
  status: string;
  gdrive_link: string;
  is_valid: boolean;
  notes: string;
  file_status: FileStatus;
  files_in_folder?: number;
  master_item?: MasterItem;
  created_at: string;
  updated_at: string;
}

interface WorkPaperApproval {
  action: "approve" | "reject_with_revision" | "reject";
  komentar?: string;
}

interface WorkPaperSignature {
  id: string;
  work_paper_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  signature_type: string;
  status: "pending" | "signed" | "rejected";
  signature_data?: {
    timestamp: string;
    digital_signature: {
      signature: string;
      payload: string;
      algorithm: string;
      public_key_id: string;
      certificate_id: string;
      timestamp: string;
      verified: boolean;
      verified_at: string;
    };
  };
  created_at: string;
  updated_at: string;
  signed_at?: string;
}

export default function WorkPaperDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params.id;

  const [workPaper, setWorkPaper] = useState<WorkPaperDetail | null>(null);
  const [workPaperNotes, setWorkPaperNotes] = useState<WorkPaperNote[]>([]);
  const [workPaperSignatures, setWorkPaperSignatures] = useState<
    WorkPaperSignature[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [signingSignature, setSigningSignature] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    np_waper: "",
    year: new Date().getFullYear(),
    semester: 1,
    status: "draft" as WorkPaperStatus,
    komentar_reviewer: "",
  });
  const [approvalForm, setApprovalForm] = useState<WorkPaperApproval>({
    action: "approve",
    komentar: "",
  });
  const [newNote, setNewNote] = useState("");
  const [isGeneratingAnswer, setIsGeneratingAnswer] = useState(false);
  const [editingDriveLinks, setEditingDriveLinks] = useState<{
    [key: string]: string;
  }>({});
  const [savingDriveLink, setSavingDriveLink] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmSignDialog, setConfirmSignDialog] = useState<string | null>(
    null
  );
  const [validationErrors, setValidationErrors] = useState<Set<string>>(new Set());
  const signaturesRef = useRef<HTMLDivElement>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<WorkPaperStatus | null>(null);
  const [syncResult, setSyncResult] = useState<SyncFolderResult | null>(null);
  const [showSyncResultModal, setShowSyncResultModal] = useState(false);

  useEffect(() => {
    // Check for action=sign in query params
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get("action");

    if (action === "sign" && (workPaper?.status === "ready_to_sign" || workPaper?.status === "completed") && !loading && workPaperSignatures.length > 0) {
      // Small timeout to ensure rendering is complete
      setTimeout(() => {
        if (signaturesRef.current) {
          signaturesRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          // Optional: Add a highlight effect or focus
          signaturesRef.current.classList.add("ring-2", "ring-blue-500", "ring-offset-2");
          setTimeout(() => {
            signaturesRef.current?.classList.remove("ring-2", "ring-blue-500", "ring-offset-2");
          }, 2000);
        }
      }, 500);
    }
  }, [workPaper, loading, workPaperSignatures]);

  const generateAIAnswerForNote = async (noteId: string) => {
    try {
      setIsGeneratingAnswer(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      // Prepare request body with note_id
      const requestBody = {
        note_id: noteId,
      };

      const response = await fetch(
        `${
          getApiBaseUrl()
        }/api/v1/desk/work-paper-notes/check`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Gagal generate AI answer untuk note: ${response.status}`
        );
      }

      const apiResponse = await response.json();

      // Handle both response formats - direct or wrapped in data field
      const result = apiResponse.data || apiResponse;

      // Update the specific note in the workPaperNotes state
      setWorkPaperNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
                ...note,
                classification: result.classification || note.classification,
                desk_instruction:
                  result.desk_instruction ||
                  note.desk_instruction,
                status: result.status || note.status,
                gdrive_link: result.gdrive_link || note.gdrive_link,
                is_valid:
                  result.is_valid !== undefined
                    ? result.is_valid
                    : note.is_valid,
                notes: result.notes || result.generated_text || note.notes,
                updated_at: new Date().toISOString(),
              }
            : note
        )
      );

      toast({
        title: "Success",
        description: "AI answer berhasil dibuat untuk note ini",
      });
    } catch (error) {
      console.error("Error generating AI answer for note:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal generate AI answer untuk note ini",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAnswer(false);
    }
  };

  const handleDriveLinkChange = (noteId: string, value: string) => {
    setEditingDriveLinks((prev) => ({
      ...prev,
      [noteId]: value,
    }));
  };

  const checkAllSignaturesSigned = (): boolean => {
    if (workPaperSignatures.length === 0) return false;

    return workPaperSignatures.every(
      signature => signature.status === "signed"
    );
  };

  const handleUpdateStatus = async (newStatus: WorkPaperStatus) => {
    try {
      // Validasi untuk status "completed"
      // Validasi untuk status "completed"
      if (newStatus === "completed") {
        setValidationErrors(new Set()); // Reset errors
        // Validasi link dokumen
        const errors = new Set<string>();
        workPaperNotes.forEach((note) => {
          // Check effective link value (editing value takes precedence if exists)
          // editingDriveLinks uses note.id as key
          const hasEdits = Object.prototype.hasOwnProperty.call(
            editingDriveLinks,
            note.id
          );
          const currentLink = hasEdits
            ? editingDriveLinks[note.id]
            : note.gdrive_link;

          if (!currentLink || currentLink.trim() === "" || currentLink === "-") {
            errors.add(note.id);
          }
        });

        if (errors.size > 0) {
          setValidationErrors(errors);
          toast({
            title: "Tidak Dapat Mengubah Status",
            description: `Status tidak dapat diubah menjadi "Completed" karena masih ada ${errors.size} item yang belum memiliki link dokumen. Harap lengkapi semua link dokumen.`,
            variant: "destructive",
          });
          return;
        }

        const allSigned = checkAllSignaturesSigned();

        if (!allSigned) {
          const pendingSignatures = workPaperSignatures.filter(
            (signature) => signature.status !== "signed"
          );

          toast({
            title: "Tidak Dapat Mengubah Status",
            description: `Status tidak dapat diubah menjadi "Completed" karena masih ada ${pendingSignatures.length} tanda tangan yang belum ditandatangani. Pastikan semua pihak telah menandatangani terlebih dahulu.`,
            variant: "destructive",
          });
          return;
        }
      }

      setUpdatingStatus(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${
          getApiBaseUrl()
        }/api/v1/desk/work-papers/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengupdate status: ${response.status}`);
      }

      await fetchWorkPaperDetail();
      toast({
        title: "Success",
        description: `Status berhasil diperbarui menjadi ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengupdate status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSaveDriveLink = async (noteId: string) => {
    try {
      setSavingDriveLink(noteId);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${
          getApiBaseUrl()
        }/api/v1/desk/work-paper-notes/${noteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            gdrive_link: editingDriveLinks[noteId],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengupdate drive link: ${response.status}`);
      }

      // Update the local state
      setWorkPaperNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? {
                ...note,
                gdrive_link: editingDriveLinks[noteId],
                updated_at: new Date().toISOString(),
              }
            : note
        )
      );

      // Clear editing state for this note
      setEditingDriveLinks((prev) => {
        const newState = { ...prev };
        delete newState[noteId];
        return newState;
      });

      toast({
        title: "Success",
        description: "Drive link berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error saving drive link:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengupdate drive link",
        variant: "destructive",
      });
    } finally {
      setSavingDriveLink(null);
    }
  };

  const handleEditNote = async (
    noteId: string,
    field: "classification" | "desk_instruction" | "notes",
    value: string
  ) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${
          getApiBaseUrl()
        }/api/v1/desk/work-paper-notes/${noteId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            [field]: value,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengupdate ${field}: ${response.status}`);
      }

      // Update the local state
      setWorkPaperNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? { ...note, [field]: value, updated_at: new Date().toISOString() }
            : note
        )
      );

      toast({
        title: "Success",
        description: `${field} berhasil diperbarui`,
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : `Gagal mengupdate ${field}`,
        variant: "destructive",
      });
    }
  };

  
  const fetchWorkPaperSignatures = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${
          getApiBaseUrl()
        }/api/v1/desk/work-paper-signatures?page=1&limit=100&work_paper_id=eq ${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengambil data signatures: ${response.status}`);
      }

      const apiResponse = await response.json();
      const signatures = apiResponse.data || [];

      // Sort by created_at or id (no signature_order in new response)
      const sortedSignatures = signatures.sort(
        (a: WorkPaperSignature, b: WorkPaperSignature) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setWorkPaperSignatures(sortedSignatures);

      console.log(sortedSignatures);
    } catch (error) {
      console.error("Error fetching work paper signatures:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data signatures",
        variant: "destructive",
      });
    }
  };

  const handleDigitalSign = async (signatureId: string) => {
    try {
      setSigningSignature(signatureId);
      setConfirmSignDialog(null);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${
          getApiBaseUrl()
        }/api/v1/desk/work-paper-signatures/${signatureId}/digital-sign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal melakukan digital sign: ${response.status}`);
      }

      // Refresh signatures data
      await fetchWorkPaperSignatures();
      await fetchWorkPaperDetail();

      toast({
        title: "Success",
        description: "Dokumen berhasil ditandatangani secara digital",
      });
    } catch (error) {
      console.error("Error digital signing:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal melakukan digital sign",
        variant: "destructive",
      });
    } finally {
      setSigningSignature(null);
    }
  };

  const getCurrentUserId = () => {
    const userData = localStorage.getItem("user_data");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || user.user_id;
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
    }
    return null;
  };

  
  const getStatusBadge = (status: WorkPaperStatus) => {
    const statusConfig = {
      draft: {
        bg: "bg-muted hover:bg-border",
        text: "text-foreground",
        label: "Draft",
      },
      ongoing: {
        bg: "bg-blue-100 hover:bg-blue-200",
        text: "text-blue-800",
        label: "Ongoing",
      },
      ready_to_sign: {
        bg: "bg-orange-100 hover:bg-orange-200",
        text: "text-orange-800",
        label: "Ready to Sign",
      },
      completed: {
        bg: "bg-green-100 hover:bg-green-200",
        text: "text-green-800",
        label: "Completed",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const canChangeStatus =
      status === "draft" || status === "ongoing" || status === "ready_to_sign";

    if (canChangeStatus) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`px-4 py-2 font-medium ${config.bg} ${config.text} border-0 flex items-center gap-2`}
            >
              {config.label}
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {(
              [
                "draft",
                "ongoing",
                "ready_to_sign",
                "completed",
              ] as WorkPaperStatus[]
            )
              .filter((s) => s !== status) // Remove current status
              .filter((nextStatus) => {
                // Nonaktifkan "completed" jika belum semua signature ditandatangani
                if (nextStatus === "completed") {
                  return checkAllSignaturesSigned();
                }
                return true;
              })
              .map((nextStatus) => {
                const nextStatusConfig = {
                  draft: "bg-muted text-muted-foreground",
                  ongoing: "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
                  ready_to_sign: "bg-orange-100 text-orange-800",
                  completed: "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
                };

                const isCompletedDisabled = nextStatus === "completed" && !checkAllSignaturesSigned();

                return (
                  <DropdownMenuItem
                    key={nextStatus}
                    onClick={() => setPendingStatusChange(nextStatus)}
                    disabled={isCompletedDisabled}
                    className={`cursor-pointer ${isCompletedDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${nextStatusConfig[nextStatus]}`}
                      >
                        {nextStatus === "ready_to_sign"
                          ? "Ready to Sign"
                          : nextStatus.charAt(0).toUpperCase() +
                            nextStatus.slice(1)}
                      </span>
                      {isCompletedDisabled && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ⚠️ Semua tanda tangan harus selesai
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    } else {
      // For completed status, just show the button without dropdown
      return (
        <Button
          variant="outline"
          disabled
          className={`px-4 py-2 font-medium ${config.bg} ${config.text} border-0`}
        >
          {config.label}
        </Button>
      );
    }
  };

  const getStatusLabel = (status: WorkPaperStatus) => {
    const labels: Record<WorkPaperStatus, string> = {
      draft: "Draft",
      ongoing: "Ongoing",
      ready_to_sign: "Ready to Sign",
      completed: "Completed",
    };
    return labels[status];
  };

  const fetchWorkPaperDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/desk/work-papers/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
          window.location.href = "/login";
          throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
        }
        if (response.status === 404) {
          throw new Error("Work Paper tidak ditemukan.");
        }
        throw new Error(`Gagal mengambil data: ${response.status}`);
      }

      const apiResponse = await response.json();
      const result: WorkPaperDetail = apiResponse.data;

      setWorkPaper(result);
      const notes = result.work_paper_notes || [];
      setWorkPaperNotes(notes);

      // Initialize editing drive links state
      const initialDriveLinks: { [key: string]: string } = {};
      notes.forEach((note) => {
        if (note.gdrive_link) {
          initialDriveLinks[note.id] = note.gdrive_link;
        }
      });
      setEditingDriveLinks(initialDriveLinks);

      setFormData({
        np_waper: result.np_waper,
        year: result.year,
        semester: result.semester,
        status: result.status,
        komentar_reviewer: result.komentar_reviewer || "",
      });
    } catch (error) {
      console.error("Error fetching work paper detail:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data work paper",
        variant: "destructive",
      });
      setLocation("/work-papers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchWorkPaperDetail();
      fetchWorkPaperSignatures();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/desk/work-papers/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: workPaper?.id,
            organization_id: workPaper?.organization_id,
            np_waper: formData.np_waper,
            year: formData.year,
            semester: formData.semester,
            status: formData.status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal menyimpan perubahan: ${response.status}`);
      }

      await fetchWorkPaperDetail();
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Work Paper berhasil diperbarui",
      });
    } catch (error) {
      console.error("Error saving work paper:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal menyimpan perubahan",
        variant: "destructive",
      });
    }
  };

  const handleExportDocx = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/desk/work-papers/${id}/docx`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal mengunduh dokumen: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `work_paper_${workPaper?.np_waper || id}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Dokumen berhasil diunduh",
      });
    } catch (error) {
      console.error("Error exporting docx:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal mengunduh dokumen",
        variant: "destructive",
      });
    }
  };

  const handleApproval = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${
          getApiBaseUrl()
        }/api/v1/desk/work-papers/${id}/approval`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(approvalForm),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal memproses approval: ${response.status}`);
      }

      await fetchWorkPaperDetail();
      setApprovalForm({ action: "approve", komentar: "" });
      toast({
        title: "Success",
        description: "Work Paper berhasil diproses",
      });
    } catch (error) {
      console.error("Error processing approval:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal memproses approval",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-lg h-6 w-6 border-b-2 border-foreground"></div>
              <span>Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!workPaper) {
    return (
      <div className="bg-background min-h-screen">
        <div className="mx-auto px-8 py-8">
          <div className="text-center py-12">
            <p>Work Paper tidak ditemukan</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-card z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/work-papers")}
            className="p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-foreground flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Button>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Detail Work Paper
            </span>
          </div>

          <div className="h-4 w-px bg-border" />

          <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
            {workPaper.np_waper}
          </span>
        </div>

        {/* Status Update & Actions */}
        <div className="flex items-center space-x-3">
          {getStatusBadge(workPaper.status)}
          {workPaper.status === "completed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportDocx}
              className="h-9 text-sm bg-card hover:bg-muted/50 text-foreground border-border flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export CHR
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-muted/30 p-6">
        <div className="w-full space-y-6">
            {/* Main Content */}
            <div className="space-y-6">
              {/* Informasi Umum */}
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Umum</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground">
                      Organization
                    </Label>
                    <div className="mt-1 p-2 bg-muted/50 rounded-md border border-border">
                      <OrganizationBadge 
                        organizationId={workPaper.organization_id} 
                        className="text-foreground"
                      />
                    </div>
                  </div>


                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        Tahun
                      </Label>
                      <Input
                        type="number"
                        value={formData.year}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            year:
                              parseInt(e.target.value) ||
                              new Date().getFullYear(),
                          })
                        }
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        Semester
                      </Label>
                      <select
                        value={formData.semester}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            semester: parseInt(e.target.value) || 1,
                          })
                        }
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md text-sm"
                      >
                        <option value={1}>Semester 1</option>
                        <option value={2}>Semester 2</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        Dibuat
                      </Label>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {formatDateTime(workPaper.created_at)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-foreground">
                        Diperbarui
                      </Label>
                      <p className="text-sm mt-1 text-muted-foreground">
                        {formatDateTime(workPaper.updated_at)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Google Drive Source Folder Configuration */}
              {(workPaper.status === "draft" || workPaper.status === "ongoing") && (
                <SourceFolderConfig
                  workPaperId={workPaper.id}
                  workPaperData={{
                    id: workPaper.id,
                    organization_id: workPaper.organization_id,
                    np_waper: workPaper.np_waper,
                    year: workPaper.year,
                    semester: workPaper.semester,
                    status: workPaper.status,
                    source_folder_link: workPaper.source_folder_link,
                  }}
                  sourceFolderLink={workPaper.source_folder_link}
                  lastFolderSyncAt={workPaper.last_folder_sync_at}
                  disabled={false}
                  onSourceFolderUpdate={(newLink) => {
                    setWorkPaper((prev) => 
                      prev ? { ...prev, source_folder_link: newLink } : null
                    );
                  }}
                  onSyncComplete={(result) => {
                    setSyncResult(result);
                    setShowSyncResultModal(true);
                    // Update notes with new file_status
                    if (result.notes_sync_status) {
                      setWorkPaperNotes((prevNotes) =>
                        prevNotes.map((note) => {
                          const syncStatus = result.notes_sync_status.find(
                            (s) => s.note_id === note.id
                          );
                          if (syncStatus) {
                            return {
                              ...note,
                              file_status: syncStatus.file_status,
                              files_in_folder: syncStatus.files_in_folder,
                              gdrive_link: syncStatus.gdrive_link || note.gdrive_link,
                            };
                          }
                          return note;
                        })
                      );
                    }
                    // Refresh work paper to get updated last_folder_sync_at
                    fetchWorkPaperDetail();
                  }}
                />
              )}

              {/* Komentar Reviewer */}
              {(workPaper.komentar_reviewer || isEditing) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Komentar Reviewer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={formData.komentar_reviewer}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            komentar_reviewer: e.target.value,
                          })
                        }
                        placeholder="Tambahkan komentar reviewer..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm">
                        {workPaper.komentar_reviewer || (
                          <span className="text-muted-foreground">
                            Belum ada komentar
                          </span>
                        )}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Audit Trail */}
              {workPaper.audit_trail && workPaper.audit_trail.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Riwayat Perubahan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workPaper.audit_trail?.map((audit) => (
                        <div
                          key={audit.id}
                          className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="w-2 h-2 bg-blue-600 rounded-lg mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">
                                {audit.action}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(audit.created_at)}
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Oleh: {audit.action_by}
                            </p>
                            {audit.old_value && audit.new_value && (
                              <div className="mt-2 text-xs">
                                <p>
                                  Dari:{" "}
                                  <span className="line-through text-muted-foreground">
                                    {audit.old_value}
                                  </span>
                                </p>
                                <p>
                                  Menjadi:{" "}
                                  <span className="text-green-600">
                                    {audit.new_value}
                                  </span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Work Paper Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Work Paper Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {workPaperNotes.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm">No notes available</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table className="w-full min-w-[2100px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]">No</TableHead>
                            <TableHead>Desk Instruction</TableHead>
                            <TableHead className="w-[140px]">File Status</TableHead>
                            <TableHead>GDrive Link</TableHead>
                            <TableHead className="w-[80px]">Valid</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-[100px]">Created</TableHead>
                            <TableHead className="w-[120px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {workPaperNotes.map((note, index) => (
                            <TableRow key={note.id}>
                              <TableCell className="font-medium text-muted-foreground">
                                {note.master_item?.number || index + 1}
                              </TableCell>
                              <TableCell className="min-w-[300px] max-w-md">
                                <div className="break-words whitespace-pre-wrap min-h-[60px] flex items-center">
                                  {note.desk_instruction || "-"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <FileStatusBadge 
                                  status={note.file_status || "pending"} 
                                  filesCount={note.files_in_folder}
                                />
                              </TableCell>
                              <TableCell className="min-w-[300px] max-w-md">
                                <div className="space-y-2">
                                  {workPaper.status === "draft" ? (
                                    <Input
                                      value={
                                        editingDriveLinks[note.id] !== undefined
                                          ? editingDriveLinks[note.id]
                                          : note.gdrive_link || ""
                                      }
                                      onChange={(e) => {
                                        handleDriveLinkChange(
                                          note.id,
                                          e.target.value
                                        );
                                        // Clear validation error when user types
                                        if (validationErrors.has(note.id)) {
                                          setValidationErrors((prev) => {
                                            const newErrors = new Set(prev);
                                            newErrors.delete(note.id);
                                            return newErrors;
                                          });
                                        }
                                      }}
                                      placeholder="Masukkan drive link"
                                      className={`w-full text-sm ${
                                        validationErrors.has(note.id)
                                          ? "border-red-500 focus-visible:ring-red-500"
                                          : ""
                                      }`}
                                    />
                                  ) : (
                                    <div className="flex items-center space-x-2">
                                      {note.gdrive_link ? (
                                        <a
                                          href={note.gdrive_link}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-primary hover:underline text-sm"
                                        >
                                          Open Link
                                        </a>
                                      ) : (
                                        <span className="text-sm">-</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="min-w-[120px]">
                                <Badge
                                  variant={
                                    note.is_valid ? "default" : "destructive"
                                  }
                                >
                                  {note.is_valid ? "Valid" : "Invalid"}
                                </Badge>
                              </TableCell>
                              <TableCell className="min-w-[450px] max-w-[900px]">
                                {workPaper.status === "ongoing" ? (
                                  <Textarea
                                    value={note.notes || ""}
                                    onChange={(e) =>
                                      handleEditNote(
                                        note.id,
                                        "notes",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Enter notes"
                                    rows={3}
                                    className="min-h-[80px] resize-y"
                                  />
                                ) : (
                                  <div className="break-words whitespace-pre-wrap min-h-[80px] flex items-center">
                                    {note.notes || "-"}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(note.created_at)}
                              </TableCell>
                              <TableCell className="min-w-[100px] max-w-xs">
                                <div className="flex items-center space-x-2">
                                  {workPaper.status === "draft" && (
                                    <>
                                      <Button
                                        onClick={() =>
                                          handleSaveDriveLink(note.id)
                                        }
                                        disabled={savingDriveLink === note.id}
                                        size="sm"
                                        variant="default"
                                        title="Save GDrive Link"
                                        className="flex items-center gap-2"
                                      >
                                        <Save className="w-3 h-3" />
                                        <span>Save</span>
                                      </Button>
                                    </>
                                  )}
                                  {workPaper.status === "ongoing" && (
                                    <Button
                                      onClick={() =>
                                        generateAIAnswerForNote(note.id)
                                      }
                                      disabled={isGeneratingAnswer}
                                      size="sm"
                                      variant="outline"
                                      className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                                      title="Generate AI Answer (hanya bisa di Ongoing)"
                                    >
                                      <Sparkles className="w-3 h-3 text-primary" />
                                      <span className="text-blue-700">
                                        {isGeneratingAnswer
                                          ? "Generating..."
                                          : "AI Generate"}
                                      </span>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Approval Section */}
            <div className="space-y-6">
              {/* Signatures Section */}
              {(workPaper.status === "ready_to_sign" ||
                workPaper.status === "completed") && (
                <Card ref={signaturesRef} className="transition-all duration-300">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PenTool className="w-5 h-5" />
                      <span>Daftar Tanda Tangan</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {workPaperSignatures.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <PenTool className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-sm">
                          Belum ada daftar tanda tangan untuk work paper ini
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[80px]">No</TableHead>
                              <TableHead>Nama</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Role</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Signed At</TableHead>
                              <TableHead>Tipe Tanda Tangan</TableHead>
                              <TableHead>Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {workPaperSignatures.map((signature, index) => {
                              const currentUserId = getCurrentUserId();
                              const canSign =
                                signature.status === "pending" &&
                                signature.user_id === currentUserId;

                              return (
                                <TableRow
                                  key={signature.id}
                                  className={
                                    canSign
                                      ? "bg-green-50 hover:bg-green-100"
                                      : "bg-muted/50"
                                  }
                                >
                                  <TableCell className="font-medium">
                                    {index + 1}
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {signature.user_name}
                                  </TableCell>
                                  <TableCell>{signature.user_email}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {signature.user_role}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        signature.status === "signed"
                                          ? "default"
                                          : "secondary"
                                      }
                                      className={
                                        signature.status === "signed"
                                          ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 hover:bg-green-200"
                                          : signature.status === "rejected"
                                          ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 hover:bg-red-200"
                                          : ""
                                      }
                                    >
                                      {signature.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {getSignedAtTimestamp(signature)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        signature.signature_type === "digital"
                                          ? "default"
                                          : "outline"
                                      }
                                      className={
                                        signature.signature_type === "digital"
                                          ? "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-200"
                                          : ""
                                      }
                                    >
                                      {signature.signature_type === "digital"
                                        ? "Digital"
                                        : signature.signature_type || "-"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {canSign ? (
                                      <>
                                        <AlertDialog
                                          open={
                                            confirmSignDialog === signature.id
                                          }
                                          onOpenChange={(open) => {
                                            if (!open)
                                              setConfirmSignDialog(null);
                                          }}
                                        >
                                          <AlertDialogTrigger asChild>
                                            <Button
                                              onClick={() =>
                                                setConfirmSignDialog(
                                                  signature.id
                                                )
                                              }
                                              disabled={
                                                signingSignature ===
                                                signature.id
                                              }
                                              size="sm"
                                              className="flex items-center gap-2"
                                            >
                                              <PenTool className="w-3 h-3" />
                                              <span>
                                                {signingSignature ===
                                                signature.id
                                                  ? "Menandatangani..."
                                                  : "Tanda Tangan Digital"}
                                              </span>
                                            </Button>
                                          </AlertDialogTrigger>
                                          <AlertDialogContent>
                                            <AlertDialogHeader>
                                              <AlertDialogTitle>
                                                Konfirmasi Tanda Tangan Digital
                                              </AlertDialogTitle>
                                              <AlertDialogDescription>
                                                Apakah Anda yakin ingin
                                                menandatangani work paper{" "}
                                                <strong>
                                                  "{workPaper?.np_waper}"
                                                </strong>{" "}
                                                secara digital?
                                                <br />
                                                <br />
                                                Tindakan ini tidak dapat
                                                dibatalkan dan akan mencatat
                                                digital signature Anda pada
                                                sistem.
                                              </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                              <AlertDialogCancel>
                                                Batal
                                              </AlertDialogCancel>
                                              <AlertDialogAction
                                                onClick={() =>
                                                  handleDigitalSign(
                                                    signature.id
                                                  )
                                                }
                                                disabled={
                                                  signingSignature ===
                                                  signature.id
                                                }
                                              >
                                                {signingSignature ===
                                                signature.id
                                                  ? "Menandatangani..."
                                                  : "Ya, Tandatangani"}
                                              </AlertDialogAction>
                                            </AlertDialogFooter>
                                          </AlertDialogContent>
                                        </AlertDialog>
                                      </>
                                    ) : (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        disabled
                                        className="text-muted-foreground"
                                      >
                                        {signature.status === "signed"
                                          ? "Selesai"
                                          : signature.status === "rejected"
                                          ? "Ditolak"
                                          : "Menunggu Antrian"}
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Komentar Approver */}
              {workPaper.komentar_approver && (
                <Card>
                  <CardHeader>
                    <CardTitle>Komentar Approver</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{workPaper.komentar_approver}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={pendingStatusChange !== null} onOpenChange={(open) => !open && setPendingStatusChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengubah status work paper dari{" "}
              <span className="font-semibold">{workPaper && getStatusLabel(workPaper.status)}</span> menjadi{" "}
              <span className="font-semibold">{pendingStatusChange && getStatusLabel(pendingStatusChange)}</span>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatusChange(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingStatusChange) {
                  handleUpdateStatus(pendingStatusChange);
                  setPendingStatusChange(null);
                }
              }}
              disabled={updatingStatus}
            >
              {updatingStatus ? "Memproses..." : "Konfirmasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sync Result Modal */}
      <SyncResultModal
        isOpen={showSyncResultModal}
        onClose={() => setShowSyncResultModal(false)}
        syncResult={syncResult}
      />
    </>
  );
}
