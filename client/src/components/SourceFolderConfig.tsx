import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, Save, RefreshCw, ExternalLink, Info, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/utils/dateFormat";
import { getApiBaseUrl } from "@/lib/env";
import { apiClient } from "@/lib/api-client";

interface WorkPaperData {
  id: string;
  organization_id: string;
  np_waper: string;
  year: number;
  semester: number;
  status: string;
  source_folder_link?: string;
}

interface SourceFolderConfigProps {
  workPaperId: string;
  workPaperData: WorkPaperData;
  sourceFolderLink?: string;
  lastFolderSyncAt?: string;
  onSyncComplete?: (syncResult: SyncFolderResult) => void;
  onSourceFolderUpdate?: (newLink: string) => void;
  disabled?: boolean;
}

export interface NoteSyncStatus {
  note_id: string;
  master_item_number: string;
  expected_folder_name: string;
  file_status: "pending" | "found" | "missing" | "linked";
  files_in_folder: number;
  gdrive_link?: string;
  message?: string;
}

export interface SyncFolderResult {
  work_paper_id: string;
  synced_at: string;
  total_notes: number;
  found_count: number;
  missing_count: number;
  linked_count: number;
  notes_sync_status: NoteSyncStatus[];
}

export function SourceFolderConfig({
  workPaperId,
  workPaperData,
  sourceFolderLink,
  lastFolderSyncAt,
  onSyncComplete,
  onSourceFolderUpdate,
  disabled = false,
}: SourceFolderConfigProps) {
  const { toast } = useToast();
  const [folderLink, setFolderLink] = useState(sourceFolderLink || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isValidGDriveLink = (link: string): boolean => {
    if (!link.trim()) return false;
    const gdrivePattern = /^https:\/\/(drive\.google\.com|docs\.google\.com)\/(drive\/)?folders\/[\w-]+/;
    return gdrivePattern.test(link);
  };

  const handleFolderLinkChange = (value: string) => {
    setFolderLink(value);
    setHasUnsavedChanges(value !== (sourceFolderLink || ""));
  };

  const handleSaveSourceFolder = async () => {
    if (!isValidGDriveLink(folderLink)) {
      toast({
        title: "Error",
        description: "Link folder Google Drive tidak valid. Pastikan formatnya benar.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      // Use the existing PUT work paper endpoint
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/desk/work-papers/${workPaperId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: workPaperData.id,
            organization_id: workPaperData.organization_id,
            np_waper: workPaperData.np_waper,
            year: workPaperData.year,
            semester: workPaperData.semester,
            status: workPaperData.status,
            source_folder_link: folderLink,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gagal menyimpan source folder: ${response.status}`);
      }

      toast({
        title: "Berhasil",
        description: "Source folder berhasil disimpan",
      });

      setHasUnsavedChanges(false);
      onSourceFolderUpdate?.(folderLink);
    } catch (error) {
      console.error("Error saving source folder:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan source folder",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncFolder = async () => {
    if (!sourceFolderLink && !folderLink) {
      toast({
        title: "Error",
        description: "Silakan simpan source folder link terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSyncing(true);
      const response = await apiClient.post<{ success: boolean; data: SyncFolderResult }>(
        `api/v1/desk/work-papers/${workPaperId}/sync-folder`,
        {}
      );

      if (response.success && response.data) {
        onSyncComplete?.(response.data);
        toast({
          title: "Sinkronisasi Selesai",
          description: `${response.data.linked_count} dari ${response.data.total_notes} folder berhasil di-link`,
        });
      }
    } catch (error) {
      console.error("Error syncing folder:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal melakukan sinkronisasi folder",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="border-blue-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="w-5 h-5 text-primary" />
          <span>Google Drive Source Folder</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="source-folder-link" className="text-sm font-medium text-foreground">
            Folder Link
          </Label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Input
                id="source-folder-link"
                type="url"
                value={folderLink}
                onChange={(e) => handleFolderLinkChange(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/FOLDER_ID"
                className={`pr-10 ${
                  folderLink && !isValidGDriveLink(folderLink)
                    ? "border-red-300 focus-visible:ring-red-500"
                    : folderLink && isValidGDriveLink(folderLink)
                    ? "border-green-300 focus-visible:ring-green-500"
                    : ""
                }`}
                disabled={disabled}
              />
              {folderLink && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isValidGDriveLink(folderLink) ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
            <Button
              onClick={handleSaveSourceFolder}
              disabled={isSaving || disabled || !hasUnsavedChanges || !isValidGDriveLink(folderLink)}
              variant="default"
              size="default"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save</span>
            </Button>
          </div>
          {folderLink && !isValidGDriveLink(folderLink) && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Format link tidak valid
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-blue-100">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4 text-blue-500" />
            {lastFolderSyncAt ? (
              <span>Terakhir sync: {formatDateTime(lastFolderSyncAt)}</span>
            ) : (
              <span className="text-muted-foreground">Belum pernah di-sync</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {sourceFolderLink && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(sourceFolderLink, "_blank")}
                className="text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                <span>Open Folder</span>
              </Button>
            )}
            <Button
              onClick={handleSyncFolder}
              disabled={isSyncing || disabled || (!sourceFolderLink && !folderLink)}
              variant="outline"
              size="default"
              className="flex items-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Folder Sekarang"}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default SourceFolderConfig;
