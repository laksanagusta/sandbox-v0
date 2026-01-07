import { useState } from "react";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiBaseUrl } from "@/lib/env";

interface UploadFormProps {
  onUploaded: (data: any) => void;
}

export default function UploadForm({ onUploaded }: UploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter((file) => {
        const ext = file.name.toLowerCase().split(".").pop();
        return ["pdf", "jpg", "jpeg", "png"].includes(ext || "");
      });

      if (validFiles.length !== selectedFiles.length) {
        setError(
          "Beberapa file ditolak. Hanya PDF, JPG, dan PNG yang diperbolehkan."
        );
      } else {
        setError(null);
      }

      setFiles(validFiles);
      setSuccess(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
    setSuccess(false);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Silakan pilih file terlebih dahulu");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("file", file);
      });

      // Get token from localStorage
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Upload gagal. Silakan coba lagi.");
      }

      const data = await response.json();

      // Validate response structure for new API format
      if (!data || typeof data !== "object") {
        throw new Error("Format response tidak valid");
      }

      setSuccess(true);
      onUploaded(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Terjadi kesalahan saat upload"
      );
      setSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Upload Dokumen</h2>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="file-upload"
            className={`
              flex flex-col items-center justify-center w-full h-32 
              border-2 border-dashed rounded-lg cursor-pointer
              transition-colors
              ${
                success
                  ? "border-chart-2 bg-chart-2/5"
                  : "border-input hover:border-primary/50 bg-muted/30"
              }
            `}
            data-testid="label-file-upload"
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {success ? (
                <>
                  <CheckCircle2 className="w-8 h-8 mb-2 text-chart-2" />
                  <p className="text-sm text-chart-2 font-medium">
                    Data Pegawaiproses!
                  </p>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Klik untuk upload</span> atau
                    drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PDF, JPG, atau PNG
                  </p>
                </>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              data-testid="input-file"
            />
          </label>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              File yang dipilih ({files.length}):
            </p>
            <div className="space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-muted/50 rounded-md text-sm"
                  data-testid={`file-item-${index}`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 flex-shrink-0"
                    data-testid={`button-remove-${index}`}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div
            className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md"
            data-testid="error-message"
          >
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full sm:w-auto"
          data-testid="button-upload"
        >
          {uploading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-lg animate-spin" />
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
