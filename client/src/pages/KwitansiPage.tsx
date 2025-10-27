import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import UploadForm from "@/components/UploadForm";
import ActivityForm from "@/components/ActivityForm";
import EditableTable from "@/components/EditableTable";
import LLMDisclaimer from "@/components/LLMDisclaimer";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Assignee, KwitansiData, Transaction } from "@shared/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { PaymentType } from "@shared/types";

interface ActivityFormInput {
  startDate: string;
  endDate: string;
  activityPurpose: string;
  destinationCity: string;
  spdDate: string;
  departureDate: string;
  returnDate: string;
  receiptSignatureDate: string;
}

// Helper function to normalize date format to YYYY-MM-DD for input fields
const normalizeDateForInput = (dateValue: any): string => {
  if (!dateValue) return "";

  try {
    // If it's already in YYYY-MM-DD format, return as is
    if (
      typeof dateValue === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(dateValue)
    ) {
      return dateValue;
    }

    // Try to parse the date and format it
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return format(date, "yyyy-MM-dd");
    }
  } catch (error) {
    console.warn("Failed to parse date:", dateValue, error);
  }

  return "";
};

export default function KwitansiPage() {
  const { toast } = useToast();
  const [kwitansiData, setKwitansiData] = useState<KwitansiData>({
    startDate: "",
    endDate: "",
    activityPurpose: "",
    destinationCity: "",
    spdDate: "",
    departureDate: "",
    returnDate: "",
    receiptSignatureDate: "",
    assignees: [],
  });

  const [activityErrors, setActivityErrors] = useState<
    Partial<Record<keyof ActivityFormInput, string>>
  >({});

  const handleActivityChange = (newActivityData: ActivityFormInput) => {
    setKwitansiData((prev) => ({
      ...prev,
      ...newActivityData,
    }));
  };

  const handleUploaded = (responseData: any) => {
    // Handle the new API response structure: { activity fields, assignees: [...] }

    // Extract activity fields directly from the response
    const extractedActivity = {
      startDate: normalizeDateForInput(responseData.startDate),
      endDate: normalizeDateForInput(responseData.endDate),
      activityPurpose: responseData.activityPurpose || "",
      destinationCity: responseData.destinationCity || "",
      spdDate: normalizeDateForInput(responseData.spdDate),
      departureDate: normalizeDateForInput(responseData.departureDate),
      returnDate: normalizeDateForInput(responseData.returnDate),
      receiptSignatureDate: normalizeDateForInput(
        responseData.receiptSignatureDate
      ),
    };

    // Process assignees array from the response
    const newAssignees: Assignee[] = (responseData.assignees || []).map(
      (assigneeItem: any) => ({
        name: assigneeItem.name || "",
        spd_number: assigneeItem.spd_number || "",
        employee_id: assigneeItem.employee_id || "",
        position: assigneeItem.position || "",
        rank: assigneeItem.rank || "",
        transactions: (assigneeItem.transactions || []).map(
          (transactionItem: any) => ({
            type: transactionItem.type || "",
            subtype: transactionItem.subtype || "",
            amount: transactionItem.amount || 0,
            subtotal: transactionItem.subtotal || 0,
            payment_type: (transactionItem.payment_type ||
              "uang muka") as PaymentType,
            description: transactionItem.description || "",
            transport_detail: transactionItem.transport_detail || "",
            spd_number: transactionItem.spd_number || "",
            total_night: transactionItem.total_night ? Number(transactionItem.total_night) : undefined,
          })
        ),
      })
    );

    // Update state with both activity data and assignees
    setKwitansiData((prev) => ({
      ...prev,
      ...extractedActivity,
      assignees: newAssignees,
    }));

    toast({
      title: "Berhasil!",
      description: `${newAssignees.length} penugas dan transaksinya berhasil dimuat dari file.`,
    });
  };

  const handleUpdateAssignees = (updatedAssignees: Assignee[]) => {
    setKwitansiData((prev) => ({ ...prev, assignees: updatedAssignees }));
  };

  const handleSaveExport = async () => {
    const { assignees, ...activityFormInput } = kwitansiData;
    const newErrors: Partial<Record<keyof ActivityFormInput, string>> = {};

    // Validation for ActivityFormInput
    if (!activityFormInput.startDate) {
      newErrors.startDate = "Tanggal mulai kegiatan harus diisi.";
    }
    if (!activityFormInput.endDate) {
      newErrors.endDate = "Tanggal selesai kegiatan harus diisi.";
    }
    if (!activityFormInput.activityPurpose) {
      newErrors.activityPurpose = "Tujuan kegiatan harus diisi.";
    }
    if (!activityFormInput.destinationCity) {
      newErrors.destinationCity = "Kota tujuan kegiatan harus diisi.";
    }
    if (!activityFormInput.spdDate) {
      newErrors.spdDate = "Tanggal SPD harus diisi.";
    }
    if (!activityFormInput.departureDate) {
      newErrors.departureDate = "Tanggal berangkat harus diisi.";
    }
    if (!activityFormInput.returnDate) {
      newErrors.returnDate = "Tanggal pulang harus diisi.";
    }
    if (!activityFormInput.receiptSignatureDate) {
      newErrors.receiptSignatureDate = "Tanggal TTD Kwitansi harus diisi.";
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

    if (
      new Date(activityFormInput.startDate) >
      new Date(activityFormInput.endDate)
    ) {
      setActivityErrors((prevErrors) => ({
        ...prevErrors,
        startDate:
          "Tanggal mulai kegiatan tidak boleh lebih besar dari tanggal selesai kegiatan.",
        endDate:
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
      startDate: format(new Date(activityFormInput.startDate), "dd MMMM yyyy", {
        locale: id,
      }),
      endDate: format(new Date(activityFormInput.endDate), "dd MMMM yyyy", {
        locale: id,
      }),
      spdDate: format(new Date(activityFormInput.spdDate), "dd MMMM yyyy", {
        locale: id,
      }),
      departureDate: format(
        new Date(activityFormInput.departureDate),
        "dd MMMM yyyy",
        {
          locale: id,
        }
      ),
      returnDate: format(
        new Date(activityFormInput.returnDate),
        "dd MMMM yyyy",
        {
          locale: id,
        }
      ),
      receiptSignatureDate: format(
        new Date(activityFormInput.receiptSignatureDate),
        "dd MMMM yyyy",
        {
          locale: id,
        }
      ),
    };

    const payload: KwitansiData = {
      ...kwitansiData,
      ...formattedActivity,
      assignees: kwitansiData.assignees.map((assignee) => ({
        ...assignee,
        transactions: assignee.transactions.map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount),
          subtotal: Number(transaction.subtotal),
          total_night: transaction.total_night ? Number(transaction.total_night) : undefined,
        })),
      })),
      exportTime: new Date().toISOString(),
    };

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/report/excel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengirim data ke API atau menerima file Excel.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recap_transactions.xlsx";
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-semibold" data-testid="text-title">
              Kwitansi
            </h1>
            <Button onClick={handleSaveExport} data-testid="button-save-export">
              <Save className="w-4 h-4 mr-2" />
              Simpan / Export
            </Button>
          </div>

          <LLMDisclaimer className="mb-6" />

          <div id="upload">
            <UploadForm onUploaded={handleUploaded} />
          </div>

          <div id="activity">
            <ActivityForm
              activity={kwitansiData}
              onChange={handleActivityChange}
              errors={activityErrors}
            />
          </div>

          <div id="transactions">
            <EditableTable
              assignees={kwitansiData.assignees}
              onUpdateAssignees={handleUpdateAssignees}
            />
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
