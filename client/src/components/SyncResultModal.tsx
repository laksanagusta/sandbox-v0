import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, FolderOpen, FileText } from "lucide-react";
import { formatDateTime } from "@/utils/dateFormat";

interface NoteSyncStatus {
  note_id: string;
  master_item_number: string;
  expected_folder_name: string;
  file_status: "pending" | "found" | "missing" | "linked";
  files_in_folder: number;
  gdrive_link?: string;
  message?: string;
}

interface SyncFolderResult {
  work_paper_id: string;
  synced_at: string;
  total_notes: number;
  found_count: number;
  missing_count: number;
  linked_count: number;
  notes_sync_status: NoteSyncStatus[];
}

interface SyncResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncResult: SyncFolderResult | null;
}

export function SyncResultModal({ isOpen, onClose, syncResult }: SyncResultModalProps) {
  if (!syncResult) return null;

  const missingFolders = syncResult.notes_sync_status.filter(
    (note) => note.file_status === "missing"
  );
  const linkedFolders = syncResult.notes_sync_status.filter(
    (note) => note.file_status === "linked"
  );

  const successRate = syncResult.total_notes > 0
    ? Math.round((syncResult.linked_count / syncResult.total_notes) * 100)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Sinkronisasi Folder Selesai</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Waktu sync: {formatDateTime(syncResult.synced_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg border">
              <div className="text-2xl font-bold text-foreground">
                {syncResult.total_notes}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Total Notes</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
              <div className="text-2xl font-bold text-green-700 flex items-center justify-center gap-1">
                <CheckCircle className="w-5 h-5" />
                {syncResult.linked_count}
              </div>
              <div className="text-xs text-green-600 mt-1">Linked</div>
            </div>
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="text-2xl font-bold text-amber-700 flex items-center justify-center gap-1">
                <AlertTriangle className="w-5 h-5" />
                {syncResult.missing_count}
              </div>
              <div className="text-xs text-amber-600 mt-1">Missing</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Success Rate</span>
              <span className="font-medium text-foreground">{successRate}%</span>
            </div>
            <div className="w-full bg-border rounded-lg h-2.5">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2.5 rounded-lg transition-all duration-500"
                style={{ width: `${successRate}%` }}
              ></div>
            </div>
          </div>

          {/* Missing Folders Section */}
          {missingFolders.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Folder yang perlu follow-up ({missingFolders.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
                {missingFolders.map((note) => (
                  <div
                    key={note.note_id}
                    className="flex items-center gap-2 text-sm text-amber-900"
                  >
                    <FolderOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="font-medium">{note.expected_folder_name}</span>
                    <Badge variant="outline" className="text-xs bg-card border-amber-200">
                      Note {note.master_item_number}
                    </Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600 italic">
                * Pastikan subfolder dengan nama yang sesuai sudah dibuat di Google Drive
              </p>
            </div>
          )}

          {/* Linked Folders Preview (collapsed by default if too many) */}
          {linkedFolders.length > 0 && linkedFolders.length <= 5 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Folder yang berhasil di-link ({linkedFolders.length})
              </h4>
              <div className="space-y-1.5 p-3 bg-green-50 rounded-lg border border-green-100">
                {linkedFolders.slice(0, 5).map((note) => (
                  <div
                    key={note.note_id}
                    className="flex items-center justify-between text-sm text-green-800"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{note.expected_folder_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-3 h-3 text-green-500" />
                      <span className="text-xs">{note.files_in_folder} files</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SyncResultModal;
