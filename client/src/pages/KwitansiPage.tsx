import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { Save, Plus, Edit, User, X, ArrowLeft, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/SearchableSelect";
import UploadForm from "@/components/UploadForm";
import ActivityForm from "@/components/ActivityForm";
import EditableTable, { ValidationError } from "@/components/EditableTable";
import LLMDisclaimer from "@/components/LLMDisclaimer";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Assignee, KwitansiData, Transaction } from "@shared/types";
import { format, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import { PaymentType } from "@shared/types";
import {
  validateStatusTransition,
  getInitialStatus,
  getNextAvailableStatuses,
} from "@/utils/statusValidation";
import { BusinessTripStatus } from "@shared/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { VerificatorsSection } from "@/components/VerificatorsSection";
import { apiClient } from "@/lib/api-client";
import { BusinessTripHistory } from "@/components/BusinessTripHistory";
import { getApiBaseUrl } from "@/lib/env";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ActivityFormInput {
  startDate: string;
  endDate: string;
  activityPurpose: string;
  destinationCity: string;
  spdDate: string;
  departureDate: string;
  returnDate: string;
  receiptSignatureDate: string;
  documentLink?: string;
}

interface Verificator {
  id: string;
  user_id: string;
  user_name: string;
  employee_number: string;
  position: string;
}

interface UserData {
  id: string;
  employee_id: string;
  username: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  roles: {
    id: string;
    name: string;
    description: string;
  }[];
  organizations: {
    id: string;
    name: string;
  };
  created_at: string;
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
  const { user } = useAuth();
  const params = useParams();
  const [, setLocation] = useLocation();
  const businessTripId = params.id;
  const isEditMode = !!businessTripId;

  const [kwitansiData, setKwitansiData] = useState<KwitansiData>({
    businessTripNumber: "",
    assignmentLetterNumber: "",
    startDate: "",
    endDate: "",
    activityPurpose: "",
    destinationCity: "",
    spdDate: "",
    departureDate: "",
    returnDate: "",
    receiptSignatureDate: new Date().toISOString().split("T")[0], // Default to today
    status: "draft",
    documentLink: "",
    assignees: [],
  });

  const [originalKwitansiData, setOriginalKwitansiData] =
    useState<KwitansiData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Verificators state
  const [verificators, setVerificators] = useState<Verificator[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [debouncedUserSearch, setDebouncedUserSearch] = useState("");
  const verificatorsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const action = searchParams.get("action");

    if (action === "verify" && !isLoading) {
      setTimeout(() => {
        if (verificatorsRef.current) {
          verificatorsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
          verificatorsRef.current.classList.add("ring-2", "ring-blue-500", "ring-offset-2", "rounded-lg");
          setTimeout(() => {
            verificatorsRef.current?.classList.remove("ring-2", "ring-blue-500", "ring-offset-2", "rounded-lg");
          }, 2000);
        }
      }, 500);
    }
  }, [isLoading]);



  const handleStatusChangeWithConfirmation = (newStatus: BusinessTripStatus) => {
    // Validate status transition
    if (validateStatusTransition(kwitansiData.status, newStatus)) {
      // Validate if all verificators approved before completed
      if (newStatus === "completed") {
        if (existingVerificators.length === 0) {
           toast({
            title: "Validasi Gagal",
            description: "Tidak ada verifikator yang ditugaskan. Silakan tambahkan verifikator terlebih dahulu.",
            variant: "destructive",
          });
          return;
        }

        const allApproved = existingVerificators.every(v => v.status === "approved");
        if (!allApproved) {
          toast({
            title: "Validasi Gagal",
            description: "Semua verifikator harus menyetujui sebelum status dapat diubah menjadi Completed.",
            variant: "destructive",
          });
          return;
        }
      }

      setPendingStatus(newStatus);
      setIsStatusDialogOpen(true);
    }
  };

  const confirmStatusChange = async () => {
    if (pendingStatus) {
      // NEW: Validation for document link when status becomes completed
      // User requested validation after clicking OK on the confirmation dialog
      if (pendingStatus === "completed" && !kwitansiData.documentLink) {
        setActivityErrors((prev) => ({
          ...prev,
          documentLink: "Link dokumen wajib diisi",
        }));
        
        toast({
          title: "Validasi Gagal",
          description: "Link dokumen wajib diisi sebelum mengubah status menjadi Completed",
          variant: "destructive",
        });
        setIsStatusDialogOpen(false);
        setPendingStatus(null);
        return;
      }

      // Update local state first to reflect change immediately
      setKwitansiData((prev) => ({ ...prev, status: pendingStatus }));
      
      // If we are in edit mode, we should also save the change to backend immediately
      if (isEditMode) {
        try {
          // Prepare minimal payload for status update to avoid validation errors on other fields
          const token = localStorage.getItem("auth_token");
          // But since backend expects full object or specific endpoint, let's just use handleSave() logic partially
          // Or better, just call handleSave() after state update? 
          // Re-reading user request: "jika oke akan langsung update statusnya".
          // This implies making an API call.
          
          // Let's use a specific patch or just save the whole form.
          // Since handleSave validates everything, it is safer to reuse parts of it or duplicate purely status update logic.
          // However, handleSave is complex. Let's try to just update status via API if possible, or trigger save.
          
          // For now, let's trigger the full save process which includes status update.
          // But handleSave relies on current state 'kwitansiData'. 
          // Since setState is async, we can't call handleSave immediately after setKwitansiData in the same closure without waiting.
          // An alternative: pass the new status to handleSave or have a specialized updateStatus function.
          
          // Given the complexity of existing handleSave, let's create a specialized function to update just status
          // OR, trust that the user will click "Save" later? 
          // "jika oke akan langsung update statusnya" -> implies immediate persistence.
          
          const response = await fetch(
            `${getApiBaseUrl()}/api/v1/business-trips/${businessTripId}/status`, 
            {
               method: 'PATCH',
               headers: {
                 'Content-Type': 'application/json',
                 'Authorization': `Bearer ${token}`
               },
               body: JSON.stringify({ status: pendingStatus })
            }
          );

          if (!response.ok) {
             throw new Error("Gagal mengupdate status");
          }
           
           toast({
            title: "Berhasil",
            description: "Status berhasil diperbarui",
          });
          
          // Refresh data to ensure sync
          fetchBusinessTripData(businessTripId!);
          
        } catch (error) {
           console.error("Failed to update status immediately", error);
           toast({
            title: "Error",
            description: "Gagal mengupdate status di server",
            variant: "destructive",
           });
           // Revert local state if server update failed
           setKwitansiData((prev) => ({ ...prev, status: originalKwitansiData?.status || "draft" }));
        }
      }
      
      setIsStatusDialogOpen(false);
      setPendingStatus(null);
    }
  };

  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<BusinessTripStatus | null>(null);

  const getStatusBadge = (status: BusinessTripStatus) => {
    const statusConfig = {
      draft: {
        bg: "bg-gray-100 hover:bg-gray-200",
        text: "text-gray-800",
        label: "Draft",
      },
      ongoing: {
        bg: "bg-blue-100 hover:bg-blue-200",
        text: "text-blue-800",
        label: "Ongoing",
      },
      ready_to_verify: {
        bg: "bg-purple-100 hover:bg-purple-200",
        text: "text-purple-800",
        label: "Ready to Verify",
      },
      completed: {
        bg: "bg-green-100 hover:bg-green-200",
        text: "text-green-800",
        label: "Completed",
      },
      canceled: {
        bg: "bg-red-100 hover:bg-red-200",
        text: "text-red-800",
        label: "Canceled",
      },
    };

    const config = statusConfig[status] || statusConfig.draft;
    const availableStatuses = getNextAvailableStatuses(status);
    // User can only change status if:
    // 1. We are in edit mode (business trip exists)
    // 2. The current status allows transitions (draft, ongoing, ready_to_verify)
    const canChangeStatus = isEditMode && (status === "draft" || status === "ongoing" || status === "ready_to_verify");

    if (canChangeStatus) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`px-4 py-2 font-medium ${config.bg} ${config.text} border-0`}
            >
              {config.label}
              <MoreHorizontal className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {availableStatuses
              .filter((s) => s !== status) // Remove current status
              .map((nextStatus) => {
                const nextStatusConfig = {
                  draft: "bg-gray-100 text-gray-800",
                  ongoing: "bg-blue-100 text-blue-800",
                  ready_to_verify: "bg-purple-100 text-purple-800",
                  completed: "bg-green-100 text-green-800",
                  canceled: "bg-red-100 text-red-800",
                };

                return (
                  <DropdownMenuItem
                    key={nextStatus}
                    onClick={() => handleStatusChangeWithConfirmation(nextStatus)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center w-full">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${nextStatusConfig[nextStatus]}`}
                      >
                        {nextStatus.charAt(0).toUpperCase() +
                          nextStatus.slice(1)}
                      </span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    } else {
      // For completed and canceled status, just show the button without dropdown
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

  const [activityErrors, setActivityErrors] = useState<
    Partial<Record<keyof ActivityFormInput, string>>
  >({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Debounce user search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserSearch(userSearch);
    }, 500);
    return () => clearTimeout(timer);
  }, [userSearch]);

  // State for verificators in edit mode
  const [existingVerificators, setExistingVerificators] = useState<any[]>([]);

  const handleVerificatorsUpdate = (verificators: any[]) => {
    setExistingVerificators(verificators);
  };
    
  // Load users when debounced search term changes
  useEffect(() => {
    if (debouncedUserSearch || users.length === 0) {
      loadUsers(debouncedUserSearch);
    }
  }, [debouncedUserSearch]);

  const loadUsers = async (searchTerm?: string) => {
    try {
      setIsLoadingUsers(true);
      const params: any = {
        page: 1,
        limit: 50,
      };
      if (searchTerm) {
        params.search = searchTerm;
      }
      const response = (await apiClient.getUsers(params)) as any;
      setUsers(response.data || []);
    } catch (error) {
      console.error("Error loading users:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data pengguna",
        variant: "destructive",
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadUsersDebounced = (searchTerm: string) => {
    setUserSearch(searchTerm);
  };

  const updateVerificator = (verificatorId: string, updates: Partial<Verificator>) => {
    setVerificators(
      verificators.map((verificator) =>
        verificator.id === verificatorId ? { ...verificator, ...updates } : verificator
      )
    );
  };

  const addNewVerificator = () => {
    const newVerificator: Verificator = {
      id: Date.now().toString(),
      user_id: "",
      user_name: "",
      employee_number: "",
      position: "",
    };
    setVerificators([...verificators, newVerificator]);
  };

  const removeVerificator = (id: string) => {
    setVerificators(verificators.filter((verificator) => verificator.id !== id));
  };


  // Fetch business trip data if in edit mode
  useEffect(() => {
    if (isEditMode && businessTripId) {
      fetchBusinessTripData(businessTripId);
    }
  }, [isEditMode, businessTripId]);

  // Detect changes
  useEffect(() => {
    if (originalKwitansiData) {
      const currentDataString = JSON.stringify(kwitansiData);
      const originalDataString = JSON.stringify(originalKwitansiData);
      setHasChanges(currentDataString !== originalDataString);
    } else {
      // For new data, check if any field has been filled
      const hasAnyData =
        kwitansiData.startDate !== "" ||
        kwitansiData.endDate !== "" ||
        kwitansiData.activityPurpose !== "" ||
        kwitansiData.destinationCity !== "" ||
        kwitansiData.spdDate !== "" ||
        kwitansiData.departureDate !== "" ||
        kwitansiData.returnDate !== "" ||
        kwitansiData.documentLink !== "" ||
        kwitansiData.assignees.length > 0 ||
        verificators.length > 0;

      setHasChanges(hasAnyData);
    }
  }, [kwitansiData, originalKwitansiData, verificators]);

  const fetchBusinessTripData = async (id: string) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/business-trips/${id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data kwitansi");
      }

      const result = await response.json();
      const data = result.data || result;

      // Transform API response to KwitansiData format
      const transformedData: KwitansiData = {
        businessTripNumber: data.business_trip_number || "",
        assignmentLetterNumber: data.assignment_letter_number || "",
        startDate: normalizeDateForInput(data.start_date),
        endDate: normalizeDateForInput(data.end_date),
        activityPurpose: data.activity_purpose || "",
        destinationCity: data.destination_city || "",
        spdDate: normalizeDateForInput(data.spd_date),
        departureDate: normalizeDateForInput(data.departure_date),
        returnDate: normalizeDateForInput(data.return_date),
        receiptSignatureDate:
          normalizeDateForInput(data.receipt_signature_date) ||
          new Date().toISOString().split("T")[0],
        status: data.status || "draft",
        documentLink: data.document_link || "",
        assignees: (data.assignees || []).map((assignee: any) => ({
          name: assignee.name || "",
          spd_number: assignee.spd_number || "",
          employee_number: assignee.employee_number || "",
          position: assignee.position || "",
          rank: assignee.rank || "",
          transactions: (assignee.transactions || []).map(
            (transaction: any) => ({
              type: transaction.type || "",
              subtype: transaction.subtype || "",
              amount: transaction.amount || 0,
              subtotal: transaction.subtotal || 0,
              payment_type: (transaction.payment_type ||
                "uang muka") as PaymentType,
              description: transaction.description || "",
              transport_detail: transaction.transport_detail || "",
              spd_number: transaction.spd_number || "",
              total_night: transaction.total_night
                ? Number(transaction.total_night)
                : undefined,
              name: transaction.name || assignee.name || "", // Fallback to assignee name
              is_valid: transaction.is_valid,
            })
          ),
        })),
      };

      setKwitansiData(transformedData);
      setOriginalKwitansiData(JSON.parse(JSON.stringify(transformedData)));
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat mengambil data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivityChange = (newActivityData: ActivityFormInput) => {
    setKwitansiData((prev) => ({
      ...prev,
      ...newActivityData,
    }));
  };

  const handleUploaded = (responseData: any) => {
    // Handle the API response structure with snake_case fields: { activity fields, assignees: [...] }

    // Extract activity fields directly from the response (snake_case to camelCase mapping)
    const extractedActivity = {
      businessTripNumber: responseData.business_trip_number || "",
      assignmentLetterNumber: responseData.assignment_letter_number || "",
      startDate: normalizeDateForInput(responseData.start_date),
      endDate: normalizeDateForInput(responseData.end_date),
      activityPurpose: responseData.activity_purpose || "",
      destinationCity: responseData.destination_city || "",
      spdDate: normalizeDateForInput(responseData.spd_date),
      departureDate: normalizeDateForInput(responseData.departure_date),
      returnDate: normalizeDateForInput(responseData.return_date),
      receiptSignatureDate:
        normalizeDateForInput(responseData.receipt_signature_date) ||
        new Date().toISOString().split("T")[0],
      documentLink: responseData.document_link || "",
    };

    // Process assignees array from the response
    const newAssignees: Assignee[] = (responseData.assignees || []).map(
      (assigneeItem: any) => ({
        name: assigneeItem.name || "",
        spd_number: assigneeItem.spd_number || "",
        employee_number: assigneeItem.employee_number || "",
        position: assigneeItem.position || "",
        rank: assigneeItem.rank || "",
        transactions: (assigneeItem.transactions || []).map(
          (transactionItem: any) => ({
            name: transactionItem.name || assigneeItem.name || "", // Fallback to assignee name
            type: transactionItem.type || "",
            subtype: transactionItem.subtype || "",
            amount: transactionItem.amount || 0,
            subtotal: transactionItem.total_night > 0 
              ? (transactionItem.amount || 0) * transactionItem.total_night 
              : (transactionItem.subtotal || transactionItem.amount || 0),
            payment_type: (transactionItem.payment_type ||
              "uang muka") as PaymentType,
            description: transactionItem.description || "",
            transport_detail: transactionItem.transport_detail || "",
            spd_number: transactionItem.spd_number || "",
            total_night: transactionItem.total_night
              ? Number(transactionItem.total_night)
              : undefined,
            is_valid: transactionItem.is_valid,
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
      description: `${newAssignees.length} data pegawai dan transaksinya berhasil dimuat dari file.`,
    });
  };

  const handleUpdateAssignees = (updatedAssignees: Assignee[]) => {
    setValidationErrors([]);
    setKwitansiData((prev) => {
      // For new business trips, do NOT auto-update status to ongoing
      // Status should remain 'draft' until manually changed or saved
      return {
        ...prev,
        assignees: updatedAssignees,
      };
    });
  };

  const handleSave = async () => {
    const { assignees, receiptSignatureDate, ...activityFormInput } =
      kwitansiData;
    const newErrors: Partial<Record<keyof ActivityFormInput, string>> = {};

    // Use status from form (for edit mode) or default to draft for new
    let calculatedStatus: BusinessTripStatus;
    if (!isEditMode) {
      // For new business trips, always start as draft
      calculatedStatus = "draft";
    } else {
      // For existing business trips, use current status from state
      calculatedStatus = kwitansiData.status;
    }

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

    // Validate documentLink if status is completed
    if (calculatedStatus === "completed") {
      if (!activityFormInput.documentLink) {
        toast({
          title: "Validasi Gagal",
          description: "Link dokumen harus diisi jika status adalah Completed",
          variant: "destructive",
        });
        return;
      }

      if (existingVerificators.length === 0) {
           toast({
            title: "Validasi Gagal",
            description: "Tidak ada verifikator yang ditugaskan. Silakan tambahkan verifikator terlebih dahulu.",
            variant: "destructive",
          });
          return;
      }

      const allApproved = existingVerificators.every(v => v.status === "approved");
      if (!allApproved) {
        toast({
          title: "Validasi Gagal",
          description: "Semua verifikator harus menyetujui sebelum status dapat diubah menjadi Completed.",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate assignees
    if (assignees.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada satu pegawai",
        variant: "destructive",
      });
      return;
    }

    for (const assignee of assignees) {
      if (
        !assignee.name ||
        !assignee.spd_number ||
        !assignee.employee_number ||
        !assignee.position ||
        !assignee.rank
      ) {
        toast({
          title: "Error",
          description: "Semua field pegawai harus diisi",
          variant: "destructive",
        });
        return;
      }

      // Validate transactions
      if (assignee.transactions.length === 0) {
        toast({
          title: "Error",
          description: `${assignee.name} harus memiliki minimal satu transaksi`,
          variant: "destructive",
        });
        return;
      }

      for (const transaction of assignee.transactions) {
        console.log(transaction);

        if (
          !transaction.name ||
          !transaction.type ||
          !transaction.subtype ||
          !transaction.amount ||
          !transaction.description
        ) {
          toast({
            title: "Error",
            description: "Semua field transaksi harus diisi",
            variant: "destructive",
          });
          return;
        }
      }
    }

    // Validate verificators for new business trip
    if (!isEditMode && verificators.length === 0) {
      toast({
        title: "Error",
        description: "Minimal harus ada satu verificator untuk membuat business trip",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    // Prepare payload for API
    const payload: any = {
      assignment_letter_number: activityFormInput.assignmentLetterNumber || null,
      start_date: activityFormInput.startDate,
      end_date: activityFormInput.endDate,
      activity_purpose: activityFormInput.activityPurpose,
      destination_city: activityFormInput.destinationCity,
      spd_date: activityFormInput.spdDate,
      departure_date: activityFormInput.departureDate,
      return_date: activityFormInput.returnDate,
      receipt_signature_date: receiptSignatureDate,
      status: calculatedStatus,
      document_link: activityFormInput.documentLink || null,
      assignees: assignees.map((assignee) => ({
        name: assignee.name,
        spd_number: assignee.spd_number,
        employee_number: assignee.employee_number,
        position: assignee.position,
        rank: assignee.rank,
        transactions: assignee.transactions.map((transaction) => ({
          name: transaction.name,
          type: transaction.type,
          subtype: transaction.subtype,
          amount: Number(transaction.amount),
          description: transaction.description,
          total_night: transaction.total_night
            ? Number(transaction.total_night)
            : undefined,
          is_valid: transaction.is_valid,
        })),
      })),
    };

    // Add verificators only when creating new business trip
    if (!isEditMode && verificators.length > 0) {
      payload.verificators = verificators.map((verificator) => ({
        user_id: verificator.user_id,
        user_name: verificator.user_name,
        employee_number: verificator.employee_number,
        position: verificator.position,
      }));
    }

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      let response;
      if (isEditMode && businessTripId) {
        // Update existing business trip
        response = await fetch(
          `${
            getApiBaseUrl()
          }/api/v1/business-trips/${businessTripId}/with-assignees`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              id: businessTripId,
              ...payload,
            }),
          }
        );
      } else {
        // Create new business trip
        response = await fetch(
          `${getApiBaseUrl()}/api/v1/business-trips`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          }
        );
      }

      if (!response.ok) {
        try {
            const errorData = await response.json();
            if (
              errorData &&
              errorData.error_type === "employee_validation_error" &&
              Array.isArray(errorData.invalid_employees)
            ) {
              setValidationErrors(errorData.invalid_employees);
              toast({
                title: "Validasi Gagal",
                description: errorData.error || "Terdapat kesalahan validasi pada data pegawai",
                variant: "destructive",
              });
              setIsSaving(false);
              return;
            }
        } catch (e) {
            // Include JSON parsing error or just ignore and throw standard error below
            console.error("Error parsing response JSON", e);
        }

        throw new Error(
          `Gagal ${
            isEditMode ? "mengupdate" : "menyimpan"
          } data kwitansi (Status: ${response.status})`
        );
      }

      // For create operation, we need the ID from Location header or response
      let savedId = null;
      if (!isEditMode) {
        // Try to get ID from Location header first
        const locationHeader = response.headers.get("Location");
        if (locationHeader) {
          // Extract ID from Location header (e.g., /api/v1/business-trips/123)
          const idMatch = locationHeader.match(/\/([a-f0-9-]{36})$/);
          if (idMatch) {
            savedId = idMatch[1];
          }
        }

        // If no Location header, try parsing JSON response for ID
        if (!savedId) {
          try {
            const result = await response.json();
            savedId = result.data?.id || result.id;
          } catch (e) {
            // If response is not JSON, that's okay - we'll handle it
            console.log("Create successful, but no ID returned");
          }
        }
      }

      // Update original data to current state
      setOriginalKwitansiData(JSON.parse(JSON.stringify(kwitansiData)));
      setHasChanges(false);

      toast({
        title: "Berhasil!",
        description: `Kwitansi berhasil ${
          isEditMode ? "diupdate" : "disimpan"
        }`,
      });

      // If creating new, redirect to edit mode if we have the ID
      if (!isEditMode && savedId) {
        window.history.pushState({}, "", `/kwitansi/${savedId}`);
        window.location.reload();
      } else if (!isEditMode) {
        // If no ID returned, just show success message and stay on create page
        toast({
          title: "Berhasil!",
          description:
            "Kwitansi berhasil disimpan. Anda bisa melanjutkan mengisi form atau membuat kwitansi baru.",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Terjadi kesalahan saat ${
                isEditMode ? "mengupdate" : "menyimpan"
              } kwitansi`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExport = async () => {
    // For now, keep the existing export functionality
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

    const formatDateForExport = (dateString: string) => {
      try {
        return format(new Date(dateString), "dd MMMM yyyy", {
          locale: id,
        });
      } catch (error) {
        return dateString;
      }
    };

    const payload = {
      business_trip_number: kwitansiData.businessTripNumber,
      assignment_letter_number: kwitansiData.assignmentLetterNumber || "",
      start_date: formatDateForExport(activityFormInput.startDate),
      end_date: formatDateForExport(activityFormInput.endDate),
      activity_purpose: activityFormInput.activityPurpose,
      destination_city: activityFormInput.destinationCity,
      spd_date: formatDateForExport(activityFormInput.spdDate),
      departure_date: formatDateForExport(activityFormInput.departureDate),
      return_date: formatDateForExport(activityFormInput.returnDate),
      receipt_signature_date: formatDateForExport(
        activityFormInput.receiptSignatureDate
      ),
      status: kwitansiData.status,
      document_link: activityFormInput.documentLink || null,
      assignees: kwitansiData.assignees.map((assignee) => ({
        name: assignee.name,
        spd_number: assignee.spd_number,
        employee_number: assignee.employee_number,
        employee_id: assignee.employee_id,
        position: assignee.position,
        rank: assignee.rank,
        transactions: assignee.transactions.map((transaction) => ({
          name: transaction.name,
          type: transaction.type,
          subtype: transaction.subtype,
          amount: Number(transaction.amount),
          subtotal: Number(transaction.subtotal),
          payment_type: transaction.payment_type || "uang muka",
          description: transaction.description,
          transport_detail: transaction.transport_detail,
          spd_number: transaction.spd_number,
          total_night: transaction.total_night
            ? Number(transaction.total_night)
            : undefined,
        })),
      })),
      export_time: new Date().toISOString(),
    };

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/report/excel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
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

  if (isLoading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Memuat data kwitansi...</p>
        </div>
      </div>
    );
  }

  // Check if status is completed or ready_to_verify to disable all fields
  // Use originalKwitansiData (saved state) to determine disabled state
  const savedStatus = originalKwitansiData?.status || "draft";
  const isFormDisabled =
    savedStatus === "completed" ||
    savedStatus === "ready_to_verify" ||
    savedStatus === "canceled";

  return (
    <div className="bg-white flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-2 border-b space-y-4 sm:space-y-0 min-h-[52px] flex-shrink-0 bg-white z-10">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/business-trips")}
            className="p-0 h-auto hover:bg-transparent text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Button>

          <div className="h-4 w-px bg-gray-200" />

          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-900">
              {isEditMode ? "Edit Business Trip" : "New Business Trip"}
            </span>
          </div>

          {isEditMode && kwitansiData.businessTripNumber && (
            <>
              <div className="h-4 w-px bg-gray-200" />
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {kwitansiData.businessTripNumber}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
           {isEditMode && businessTripId && (
              <BusinessTripHistory businessTripId={businessTripId} />
           )}
           {getStatusBadge(kwitansiData.status)}
           
           <Button
             onClick={handleSaveExport}
             variant="outline"
             size="sm"
             className="h-8 text-xs"
             data-testid="button-save-export"
           >
             <Save className="w-3.5 h-3.5" />
             Export
           </Button>

           <Button
             onClick={handleSave}
             disabled={!hasChanges || isSaving}
             size="sm"
             className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
             data-testid="button-save"
           >
             <Save className="w-3.5 h-3.5" />
             {isSaving ? "Saving..." : "Save"}
           </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6">
        <div className="w-full space-y-6">
          {!isEditMode && <LLMDisclaimer className="mb-6" />}

          <div id="upload">
            <UploadForm onUploaded={handleUploaded} disabled={isFormDisabled} />
          </div>

          <div id="activity">
            <ActivityForm
              activity={kwitansiData}
              onChange={handleActivityChange}
              errors={activityErrors}
              disabled={isFormDisabled}
              isDocumentLinkEnabled={savedStatus === "ready_to_verify"}
            />
          </div>

          <div id="transactions">
            <EditableTable
              assignees={kwitansiData.assignees}
              onUpdateAssignees={handleUpdateAssignees}
              disabled={isFormDisabled}
              validationErrors={validationErrors}
            />
          </div>

          {/* Verificators Section */}
          {!isEditMode ? (
            /* Create Mode: Show form to add verificators */
            <div id="verificators">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Daftar Verificators</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Verificator Rows */}
                  {verificators.map((verificator, index) => (
                    <div
                      key={verificator.id}
                      className="border rounded-lg p-4 space-y-4 bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-muted-foreground" />
                          <span className="font-medium">Verificator #{index + 1}</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeVerificator(verificator.id)}
                          disabled={isFormDisabled}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Pilih User
                          </Label>
                          <SearchableSelect
                            value={verificator.user_id}
                            onValueChange={(value) => {
                              const selectedUser = users.find(
                                (user) => user.id === value
                              );
                              if (selectedUser) {
                                updateVerificator(verificator.id, {
                                  user_id: selectedUser.id,
                                  user_name: `${selectedUser.first_name} ${selectedUser.last_name}`,
                                  employee_number: selectedUser.employee_id,
                                  position: selectedUser.roles[0]?.name || "",
                                });
                              }
                            }}
                            placeholder="Pilih user"
                            disabled={isLoadingUsers || isFormDisabled}
                            loading={isLoadingUsers}
                            options={users.map((user) => ({
                              value: user.id,
                              label: `${user.first_name} ${user.last_name}`,
                              subtitle: user.username,
                            }))}
                            onSearch={loadUsersDebounced}
                            searchPlaceholder="Cari user..."
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Nama Lengkap
                          </Label>
                          <Input
                            value={verificator.user_name}
                            onChange={(e) =>
                              updateVerificator(verificator.id, { user_name: e.target.value })
                            }
                            placeholder="Masukkan nama"
                            className="mt-1"
                            disabled={isFormDisabled}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Employee Number
                          </Label>
                          <Input
                            value={verificator.employee_number}
                            onChange={(e) =>
                              updateVerificator(verificator.id, {
                                employee_number: e.target.value,
                              })
                            }
                            placeholder="Nomor pegawai"
                            className="mt-1"
                            disabled={isFormDisabled}
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-gray-700">
                            Position
                          </Label>
                          <Input
                            value={verificator.position}
                            onChange={(e) =>
                              updateVerificator(verificator.id, { position: e.target.value })
                            }
                            placeholder="Jabatan"
                            className="mt-1"
                            disabled={isFormDisabled}
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Add Verificator Button */}
                  <div className="pt-4">
                    <Button
                      onClick={addNewVerificator}
                      variant="outline"
                      disabled={isFormDisabled}
                      className="flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Verificator Baru</span>
                    </Button>
                  </div>

                  {/* Verificators Summary */}
                  {verificators.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-blue-900">
                            Ringkasan Verificators
                          </h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Total {verificators.length} verificator akan ditambahkan untuk verifikasi business trip ini
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            /* Edit Mode: Show existing verificators */
            businessTripId && (
              <div id="verificators" ref={verificatorsRef}>
                <VerificatorsSection 
                  businessTripId={businessTripId} 
                  businessTripStatus={savedStatus}
                  onVerificatorsUpdate={handleVerificatorsUpdate}
                />
              </div>
            )
          )}
          
        </div>
      </div>

      <AlertDialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengubah status business trip ini menjadi{" "}
              <span className="font-semibold">
                {pendingStatus === "ready_to_verify"
                  ? "Ready to Verify"
                  : pendingStatus === "completed"
                  ? "Completed"
                  : pendingStatus === "canceled"
                  ? "Canceled"
                  : pendingStatus}
              </span>
              ?
              {pendingStatus === "canceled" && (
                <span className="block mt-2 text-destructive">
                  Perhatian: Tindakan ini tidak dapat dibatalkan.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingStatus(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              className={
                pendingStatus === "canceled" ? "bg-red-600 hover:bg-red-700" : ""
              }
            >
              Ya, Ubah Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
