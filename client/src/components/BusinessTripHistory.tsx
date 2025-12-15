import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { History, CheckCircle2, AlertCircle, Edit2, FileText, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getApiBaseUrl } from "@/lib/env";

interface HistoryItem {
  id: string;
  business_trip_id: string;
  change_type: string;
  field_name: string;
  old_value?: string;
  new_value?: string;
  changed_by_user_name?: string;
  user_name?: string;
  changer_name?: string;
  username?: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

interface BusinessTripHistoryProps {
  businessTripId: string;
}

export function BusinessTripHistory({ businessTripId }: BusinessTripHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && businessTripId) {
      fetchHistory();
    }
  }, [isOpen, businessTripId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/business-trips/${businessTripId}/histories`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "verification_approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "verification_rejected":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "status_change":
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <Edit2 className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatValue = (val: string | undefined) => {
    if (!val) return "-";
    return val.replace(/_/g, " ");
  };

  const getUserName = (item: any) => {
    return (
      item.changed_by_user_name ||
      item.user_name ||
      item.changer_name ||
      item.username ||
      item.changed_by ||
      "Unknown User"
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <History className="h-4 w-4" />
          Riwayat
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Riwayat Perubahan</SheetTitle>
          <SheetDescription>
            Catatan aktivitas dan perubahan pada business trip ini.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-100px)] mt-4 pr-4">
          {loading ? (
            <div className="text-center py-4">Memuat data...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Belum ada riwayat perubahan.
            </div>
          ) : (
            <div className="space-y-8 pl-2 pt-4">
              {history.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 pb-4 last:pb-0">
                  {/* Vertical Line */}
                  {index !== history.length - 1 && (
                    <div className="absolute left-[7px] top-6 h-full w-[2px] bg-gray-200" />
                  )}

                  <div className="mt-1 flex h-4 w-4 flex-none items-center justify-center rounded-full bg-white ring-2 ring-gray-200 z-10">
                    {getIcon(item.change_type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">
                        {getUserName(item)}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(item.created_at), "dd MMM HH:mm", {
                          locale: id,
                        })}
                      </span>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {item.change_type === "status_change" ? (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span>Mengubah status</span>
                          <span className="font-medium text-foreground px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            {formatValue(item.old_value)}
                          </span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium text-foreground px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                            {formatValue(item.new_value)}
                          </span>
                        </div>
                      ) : item.change_type === "verification_approved" ? (
                        <div>
                          <span className="text-green-600 font-medium">Menyetujui verifikasi</span>
                          {item.notes && (
                            <div className="mt-1 p-2 bg-gray-50 rounded text-xs italic border border-gray-100">
                              "{item.notes}"
                            </div>
                          )}
                        </div>
                      ) : item.change_type === "verification_rejected" ? (
                        <div>
                          <span className="text-red-600 font-medium">Menolak verifikasi</span>
                          {item.notes && (
                            <div className="mt-1 p-2 bg-red-50 rounded text-xs italic border border-red-100 text-red-800">
                              "{item.notes}"
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          Mengubah {item.field_name}
                          {item.old_value && item.new_value && (
                            <div className="flex items-center gap-1 mt-1 text-xs">
                              <span className="line-through opacity-70">
                                {formatValue(item.old_value)}
                              </span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{formatValue(item.new_value)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
