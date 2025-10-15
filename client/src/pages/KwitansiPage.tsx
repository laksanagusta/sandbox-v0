import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadForm from "@/components/UploadForm";
import ActivityForm from "@/components/ActivityForm";
import EditableTable from "@/components/EditableTable";
import { useToast } from "@/hooks/use-toast";
import { EditableRow, TransactionDTO } from "@shared/types";

interface ActivityData {
  start_date: string;
  end_date: string;
  destination: string;
}

export default function KwitansiPage() {
  const { toast } = useToast();
  const [activity, setActivity] = useState<ActivityData>({
    start_date: "",
    end_date: "",
    destination: "",
  });

  const [tableRows, setTableRows] = useState<EditableRow[]>([]);
  const [description, setDescription] = useState("");

  const handleUploaded = (data: any[]) => {
    // Normalize data - ensure all required fields exist with defaults
    const normalized = data.map((item, index) => ({
      id: String(index),
      description: item.description || "",
      name: item.name || "",
      type: item.type || "",
      subtype: item.subtype || "",
      amount: item.amount || 0,
      total_night: item.total_night || "",
      subtotal: item.subtotal || 0, // Tambahkan subtotal
      transport_detail: item.transport_detail || "",
    }));

    setTableRows(normalized);
    toast({
      title: "Berhasil!",
      description: `${normalized.length} transaksi berhasil dimuat dari file.`,
    });
  };

  const handleSaveExport = async () => {
    const transactionsDTO: TransactionDTO[] = tableRows.map((row) => ({
      name: row.name,
      type: row.type,
      subtype: row.subtype,
      amount: row.amount,
      total_night: parseInt(row.total_night) || undefined,
      subtotal: row.subtotal,
    }));

    const payload = { transactions: transactionsDTO };

    try {
      const response = await fetch("http://localhost:5002/api/report/excel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Gagal mengirim data ke API atau menerima file Excel.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recap_transactions.xlsx"; // Nama file yang akan diunduh
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Berhasil!",
        description: "File Excel berhasil diunduh.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengunduh file Excel.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Header with Title and Save Button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold" data-testid="text-title">
              MVP Kwitansi PNS
            </h1>
            <Button onClick={handleSaveExport} data-testid="button-save-export">
              <Save className="w-4 h-4 mr-2" />
              Simpan / Export
            </Button>
          </div>

          {/* Upload Section */}
          <div id="upload">
            <UploadForm onUploaded={handleUploaded} />
          </div>

          {/* Activity Form Section */}
          <div id="activity">
            <ActivityForm activity={activity} onChange={setActivity} />
          </div>

          {/* Editable Table Section */}
          <div id="transactions">
            <EditableTable rows={tableRows} setRows={setTableRows} />
          </div>
        </div>
      </div>
    </div>
  );
}
