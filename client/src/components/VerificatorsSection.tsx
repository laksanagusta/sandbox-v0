import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, AlertCircle, User, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDateTime } from "@/utils/dateFormat";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export type VerificationStatus = "pending" | "approved" | "rejected";

interface Verificator {
  id: string;
  business_trip_id: string;
  user_id: string;
  user_name: string;
  employee_number: string;
  position: string;
  status: VerificationStatus;
  verification_notes?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
}

interface VerificatorsSectionProps {
  businessTripId: string;
  businessTripStatus?: string;
  onVerificatorsUpdate?: (verificators: Verificator[]) => void;
}

export function VerificatorsSection({ businessTripId, businessTripStatus, onVerificatorsUpdate }: VerificatorsSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [verificators, setVerificators] = useState<Verificator[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject">("approve");

  useEffect(() => {
    fetchVerificators();
  }, [businessTripId]);

  const fetchVerificators = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        business_trip_id: `eq ${businessTripId}`,
        sort: "created_at desc",
      });

      const response = await apiClient.get<any>(
        `/api/v1/business-trips/verificators?${params.toString()}`
      );
      setVerificators(response.data || []);
      if (onVerificatorsUpdate) {
        onVerificatorsUpdate(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching verificators:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data verificators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openVerificationDialog = (type: "approve" | "reject") => {
    setActionType(type);
    setVerificationNotes("");
    setIsDialogOpen(true);
  };

  const handleConfirmVerification = async () => {
    if (!verificationNotes.trim()) {
      toast({
        title: "Error",
        description: "Verification notes harus diisi",
        variant: "destructive",
      });
      return;
    }

    console.log("VerificatorsSection - Initiating verification:", {
      businessTripId,
      actionType,
      notesLength: verificationNotes.length,
    });

    try {
      console.log("VerificatorsSection - Calling apiClient.post...");
      const response = await apiClient.post(
        `/api/v1/business-trips/${businessTripId}/verify`,
        {
          status: actionType === "approve" ? "approved" : "rejected",
          verification_notes: verificationNotes,
        }, false
      );

      setIsDialogOpen(false);
      setVerificationNotes("");
      
      await fetchVerificators();
      toast({
        title: "Success",
        description: `Verifikasi berhasil ${actionType === "approve" ? "disetujui" : "ditolak"}`,
      });
    } catch (error) {
      console.error("Error verifying business trip:", error);
      
      // Check if it's an authentication error
      if (error instanceof Error && error.message.includes("Sesi Anda telah berakhir")) {
        // ApiClient already handled the redirect, just show the error
        return;
      }
      
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : `Gagal ${actionType === "approve" ? "menyetujui" : "menolak"} verifikasi`,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    const statusConfig = {
      pending: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "Pending",
      },
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "Approved",
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        label: "Rejected",
      },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const isCurrentUser = (userId: string) => {
    return user?.id === userId;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CheckSquare className="w-6 h-6" />
          <span>Verificators</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading...</span>
          </div>
        ) : verificators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CheckSquare className="mx-auto h-12 w-12 text-gray-300 mb-2" />
            <p>Tidak ada verificator</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Employee Number</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified At</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verificators.map((verificator) => (
                  <TableRow
                    key={verificator.id}
                    className={
                      isCurrentUser(verificator.user_id)
                        ? "bg-blue-50 hover:bg-blue-100"
                        : ""
                    }
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-2">
                        <div>
                          <p>{verificator.user_name}</p>
                        </div>
                        {isCurrentUser(verificator.user_id) && (
                          <Badge className="bg-blue-600 text-white">
                            You
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{verificator.employee_number}</TableCell>
                    <TableCell>{verificator.position}</TableCell>
                    <TableCell>
                      {getStatusBadge(verificator.status)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {verificator.verified_at ? (
                        <div className="flex flex-col">
                          <span>{formatDateTime(verificator.verified_at)}</span>
                          {verificator.status !== "pending" && (
                            <span className="text-xs text-gray-400 mt-1">
                              {verificator.status === "approved" ? "✓ Approved" : "✗ Rejected"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isCurrentUser(verificator.user_id) &&
                      verificator.status === "pending" &&
                      businessTripStatus === "ready_to_verify" ? (
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => openVerificationDialog("approve")}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckSquare className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => openVerificationDialog("reject")}
                            size="sm"
                            variant="destructive"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : verificator.status === "approved" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckSquare className="w-3 h-3 mr-1" />
                          Disetujui
                        </Badge>
                      ) : verificator.status === "rejected" ? (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Ditolak
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <User className="w-3 h-3 mr-1" />
                          Menunggu
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Business Trip Verification
            </DialogTitle>
            <DialogDescription>
              Silakan masukkan catatan verifikasi sebelum {actionType === "approve" ? "menyetujui" : "menolak"} business trip ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Verification Notes <span className="text-red-500">*</span>
              </label>
              <Textarea
                id="notes"
                placeholder="Masukkan catatan verifikasi..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-gray-500">
                Catatan ini wajib diisi dan akan tersimpan dalam sistem.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setVerificationNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmVerification}
              className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {actionType === "approve" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
