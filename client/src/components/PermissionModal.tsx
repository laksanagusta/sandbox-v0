import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getApiIdentityUrl } from "@/lib/env";

interface Permission {
  id: string;
  name: string;
  action: string;
  resource: string;
}

interface PermissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  permission?: Permission | null; // If present, update mode
  onSuccess: () => void;
}

export function PermissionModal({
  open,
  onOpenChange,
  permission,
  onSuccess,
}: PermissionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    action: "",
    resource: "",
  });

  useEffect(() => {
    if (open) {
      if (permission) {
        setFormData({
          name: permission.name,
          action: permission.action,
          resource: permission.resource,
        });
      } else {
        setFormData({
          name: "",
          action: "",
          resource: "",
        });
      }
    }
  }, [open, permission]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan");
      }

      const url = permission
        ? `${getApiIdentityUrl()}/api/v1/permissions/${permission.id}`
        : `${getApiIdentityUrl()}/api/v1/permissions`;

      const method = permission ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Gagal menyimpan permission: ${response.status}`);
      }

      toast({
        title: "Berhasil",
        description: `Permission berhasil ${permission ? "diperbarui" : "dibuat"}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving permission:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyimpan permission",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {permission ? "Edit Permission" : "Tambah Permission"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Permission</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Contoh: Update Workflow"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action">Action</Label>
            <Select
              value={formData.action}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, action: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="read">read</SelectItem>
                <SelectItem value="write">write</SelectItem>
                <SelectItem value="update">update</SelectItem>
                <SelectItem value="delete">delete</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="resource">Resource</Label>
            <Input
              id="resource"
              value={formData.resource}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, resource: e.target.value }))
              }
              placeholder="Contoh: workflow"
              required
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
