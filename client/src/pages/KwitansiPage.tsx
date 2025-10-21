import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadForm from "@/components/UploadForm";
import ActivityForm from "@/components/ActivityForm";
import EditableTable from "@/components/EditableTable";
import { useToast } from "@/hooks/use-toast";
import { EditableRow, TransactionDTO } from "@shared/types";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { PaymentType } from "@shared/types";

interface ActivityData {
  start_date: string;
  end_date: string;
  destination: string;
  destination_city: string;
  spd_date: string;
  departure_date: string;
  return_date: string;
  receipt_sign_date: string;
}

export default function KwitansiPage() {
  const { toast } = useToast();
  const [activity, setActivity] = useState<ActivityData>({
    start_date: "",
    end_date: "",
    destination: "",
    destination_city: "",
    spd_date: "",
    departure_date: "",
    return_date: "",
    receipt_sign_date: "",
  });
  const [activityErrors, setActivityErrors] = useState<
    Partial<Record<keyof ActivityData, string>>
  >({});

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
      payment_type: (item.payment_type || "uang muka") as PaymentType, // Default value and cast
      spd_number: item.spd_number || "",
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
      payment_type: row.payment_type,
      spd_number: row.spd_number,
    }));

    const newErrors: Partial<Record<keyof ActivityData, string>> = {};

    if (!activity.start_date) {
      newErrors.start_date = "Tanggal mulai kegiatan harus diisi.";
    }
    if (!activity.end_date) {
      newErrors.end_date = "Tanggal selesai kegiatan harus diisi.";
    }
    if (!activity.destination) {
      newErrors.destination = "Tujuan kegiatan harus diisi.";
    }
    if (!activity.destination_city) {
      newErrors.destination_city = "Kota tujuan kegiatan harus diisi.";
    }
    if (!activity.spd_date) {
      newErrors.spd_date = "Tanggal SPD harus diisi.";
    }
    if (!activity.departure_date) {
      newErrors.departure_date = "Tanggal berangkat harus diisi.";
    }
    if (!activity.return_date) {
      newErrors.return_date = "Tanggal pulang harus diisi.";
    }
    if (!activity.receipt_sign_date) {
      newErrors.receipt_sign_date = "Tanggal TTD Kwitansi harus diisi.";
    }

    if (Object.keys(newErrors).length > 0) {
      setActivityErrors(newErrors);
      toast({
        title: "Error",
        description: "Harap lengkapi semua field kegiatan yang wajib diisi.",
        variant: "destructive",
      });
      return;
    }

    if (new Date(activity.start_date) > new Date(activity.end_date)) {
      setActivityErrors((prevErrors) => ({
        ...prevErrors,
        start_date:
          "Tanggal mulai kegiatan tidak boleh lebih besar dari tanggal selesai kegiatan.",
        end_date:
          "Tanggal selesai kegiatan tidak boleh lebih kecil dari tanggal mulai kegiatan.",
      }));
      toast({
        title: "Error",
        description:
          "Tanggal mulai kegiatan tidak boleh lebih besar dari tanggal selesai kegiatan.",
        variant: "destructive",
      });
      return;
    }

    const formattedActivity = {
      ...activity, // Include all original activity properties
      start_date: format(new Date(activity.start_date), "dd MMMM yyyy", {
        locale: id,
      }),
      end_date: format(new Date(activity.end_date), "dd MMMM yyyy", {
        locale: id,
      }),
      spd_date: format(new Date(activity.spd_date), "dd MMMM yyyy", {
        locale: id,
      }),
      departure_date: format(
        new Date(activity.departure_date),
        "dd MMMM yyyy",
        {
          locale: id,
        }
      ),
      return_date: format(new Date(activity.return_date), "dd MMMM yyyy", {
        locale: id,
      }),
      receipt_sign_date: format(
        new Date(activity.receipt_sign_date),
        "dd MMMM yyyy",
        {
          locale: id,
        }
      ),
    };

    const payload = {
      transactions: transactionsDTO,
      ...formattedActivity,
    };

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
              Kwitansi
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
            <ActivityForm
              activity={activity}
              onChange={setActivity}
              errors={activityErrors}
            />
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
