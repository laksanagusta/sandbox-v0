import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableRow, PaymentType } from "@shared/types";

interface EditableTableProps {
  rows: EditableRow[];
  setRows: React.Dispatch<React.SetStateAction<EditableRow[]>>;
}

export default function EditableTable({ rows, setRows }: EditableTableProps) {
  const updateRow = (
    index: number,
    field: keyof EditableRow,
    value: string | number
  ) => {
    setRows((prevRows: EditableRow[]) =>
      prevRows.map((row: EditableRow, i: number) =>
        i === index
          ? {
              ...row,
              [field]:
                typeof value === "string" && field === "amount"
                  ? parseInt(value.replace(/\D/g, "")) || 0
                  : value,
            }
          : row
      )
    );
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: "",
        description: "",
        amount: 0,
        name: "",
        type: "",
        subtype: "",
        total_night: "",
        subtotal: 0,
        payment_type: "uang muka", // Default value
        spd_number: "",
      },
    ]);
  };

  const deleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount);
  };

  const calculateTotal = () => {
    const total = rows.reduce((sum, row) => {
      return sum + row.amount;
    }, 0);
    return formatRupiah(total);
  };

  const updateSpdNumber = (index: number, value: string) => {
    setRows((prevRows) => {
      const nameToMatch = prevRows[index]?.name;
      if (!nameToMatch) return prevRows; // If no name, do nothing
      return prevRows.map((row) =>
        row.name === nameToMatch ? { ...row, spd_number: value } : row
      );
    });
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Transaksi</h2>
        <Button
          onClick={addRow}
          variant="outline"
          size="sm"
          data-testid="button-add-row"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Baris
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="">
          <thead>
            <tr className="border-b">
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Nama
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                No. SPD
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Tipe
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Subtipe
              </th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Jumlah (Rp)
              </th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Total Malam
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap min-w-[150px]">
                Tipe Pembayaran
              </th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Subtotal (Rp)
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Detail Transport
              </th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide py-3 px-2 whitespace-nowrap">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isTransport = row.type.toLowerCase() === "transport";

              return (
                <tr
                  key={index}
                  className="border-b hover:bg-muted/30 transition-colors"
                  data-testid={`row-${index}`}
                >
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(index, "name", e.target.value)}
                      placeholder="Nama"
                      className="h-8 text-sm"
                      data-testid={`input-name-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Input
                      value={row.spd_number || ""}
                      onChange={(e) => updateSpdNumber(index, e.target.value)}
                      placeholder="No. SPD"
                      className="h-8 text-sm"
                      data-testid={`input-spd-number-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Input
                      value={row.type}
                      onChange={(e) => updateRow(index, "type", e.target.value)}
                      placeholder="Tipe"
                      className="h-8 text-sm"
                      data-testid={`input-type-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Input
                      value={row.subtype}
                      onChange={(e) =>
                        updateRow(index, "subtype", e.target.value)
                      }
                      placeholder="Subtipe"
                      className="h-8 text-sm"
                      data-testid={`input-subtype-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Input
                      value={String(row.amount)}
                      onChange={(e) =>
                        updateRow(index, "amount", e.target.value)
                      }
                      placeholder="0"
                      className="h-8 text-sm text-right font-mono"
                      data-testid={`input-amount-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Input
                      value={row.total_night}
                      onChange={(e) =>
                        updateRow(index, "total_night", e.target.value)
                      }
                      placeholder="0"
                      className="h-8 text-sm text-center"
                      data-testid={`input-total-night-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <Select
                      value={row.payment_type}
                      onValueChange={(value: PaymentType) =>
                        updateRow(index, "payment_type", value)
                      }
                    >
                      <SelectTrigger
                        className="h-8 text-sm min-w-[150px]"
                        data-testid={`select-payment-type-${index}`}
                      >
                        <SelectValue placeholder="Pilih tipe pembayaran" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="uang_muka">Uang Muka</SelectItem>
                        <SelectItem value="rampung">Rampung</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-2 px-2 text-right font-mono text-sm whitespace-nowrap">
                    {formatRupiah(row.subtotal)}
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    {isTransport ? (
                      <Select
                        value={row.transport_detail || ""}
                        onValueChange={(value) =>
                          updateRow(index, "transport_detail", value)
                        }
                      >
                        <SelectTrigger
                          className="h-8 text-sm"
                          data-testid={`select-transport-detail-${index}`}
                        >
                          <SelectValue placeholder="Pilih detail" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transport_asal">
                            Transport Asal
                          </SelectItem>
                          <SelectItem value="transport_daerah">
                            Transport Daerah
                          </SelectItem>
                          <SelectItem value="transport_darat">
                            Transport Darat
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-8 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">-</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center whitespace-nowrap">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => deleteRow(index)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      data-testid={`button-delete-${index}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-muted/50">
              <td
                colSpan={5}
                className="py-3 px-2 text-sm font-semibold text-right whitespace-nowrap"
              >
                Total
              </td>
              <td
                className="py-3 px-2 text-sm font-semibold text-right font-mono whitespace-nowrap"
                data-testid="text-total"
              >
                Rp {calculateTotal()}
              </td>
              <td colSpan={4} className="whitespace-nowrap"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {rows.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">
            Belum ada transaksi. Upload dokumen atau tambah baris secara manual.
          </p>
        </div>
      )}
    </Card>
  );
}
