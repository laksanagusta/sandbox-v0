import { useState } from "react";
import { Plus, Trash2, AlertCircle } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Assignee, PaymentType, Transaction } from "@shared/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface ValidationError {
  index: number;
  field: string;
  message: string;
}

interface EditableTableProps {
  assignees: Assignee[];
  onUpdateAssignees: (assignees: Assignee[]) => void;
  disabled?: boolean;
  validationErrors?: ValidationError[];
}

export default function EditableTable({
  assignees,
  onUpdateAssignees,
  disabled = false,
  validationErrors = [],
}: EditableTableProps) {
  const updateTransaction = (
    assigneeIndex: number,
    transactionIndex: number,
    field: keyof Transaction,
    value: string | number | boolean
  ) => {
    const updatedAssignees = assignees.map((assignee, aIdx) => {
      if (aIdx === assigneeIndex) {
        const updatedTransactions = assignee.transactions.map(
          (transaction, tIdx) => {
            if (tIdx === transactionIndex) {
              // Handle numeric fields separately
              const numValue: number =
                typeof value === "string" &&
                (field === "amount" ||
                  field === "subtotal" ||
                  field === "total_night")
                  ? parseInt(value.replace(/\D/g, "")) || 0
                  : typeof value === "number"
                  ? value
                  : 0;

              // For string fields (payment_type, transport_detail, type, subtype, description), keep as string
              const stringValue: string =
                field === "payment_type" ||
                field === "transport_detail" ||
                field === "type" ||
                field === "subtype" ||
                field === "description" ||
                field === "spd_number"
                  ? value as string
                  : "";

              // For boolean fields
              const boolValue: boolean = typeof value === "boolean" ? value : false;

              // Generic logic for subtotal calculation:
              // If there are total_nights defined (> 0), subtotal is amount * total_night.
              // Otherwise, subtotal logic might just be manual or default.
              // But the user requested: "jika dia ada total_nightsnya maka sub totalnya adalah hasil kali ammount dengan total nightsnya"
              
              if (field === "amount") {
                 const currentNights = transaction.total_night || 0;
                 const multiplier = currentNights > 0 ? currentNights : 1;
                 
                  return {
                    ...transaction,
                    amount: numValue,
                    subtotal: numValue * multiplier,
                  };
              }

              if (field === "total_night") {
                 const currentAmount = transaction.amount || 0;
                 const multiplier = numValue > 0 ? numValue : 1;
                 
                 return {
                    ...transaction,
                    total_night: numValue,
                    subtotal: currentAmount * multiplier,
                 };
              }

              // Update other fields
              const isStringField = field === "payment_type" ||
                field === "transport_detail" ||
                field === "type" ||
                field === "subtype" ||
                field === "description" ||
                field === "spd_number";
              const isBooleanField = field === "is_valid";

              return {
                ...transaction,
                [field]: isBooleanField ? boolValue : (isStringField ? stringValue : numValue),
              };
            }
            return transaction;
          }
        );
        return { ...assignee, transactions: updatedTransactions };
      }
      return assignee;
    });
    onUpdateAssignees(updatedAssignees);
  };

  const updateAssigneeField = (
    assigneeIndex: number,
    field: keyof Assignee,
    value: string
  ) => {
    const updatedAssignees = assignees.map((assignee, aIdx) => {
      if (aIdx === assigneeIndex) {
        // If updating the name field, also update transaction names
        if (field === "name") {
          return {
            ...assignee,
            [field]: value,
            transactions: assignee.transactions.map((transaction) => ({
              ...transaction,
              name: value,
            })),
          };
        }
        return {
          ...assignee,
          [field]: value,
        };
      }
      return assignee;
    });
    onUpdateAssignees(updatedAssignees);
  };

  const addTransaction = (assigneeIndex: number) => {
    const updatedAssignees = assignees.map((assignee, aIdx) => {
      if (aIdx === assigneeIndex) {
        return {
          ...assignee,
          transactions: [
            ...assignee.transactions,
            {
              name: assignee.name, // Auto-populate with assignee name
              type: "",
              subtype: "",
              amount: 0,
              subtotal: 0,
              payment_type: "uang muka" as PaymentType,
              description: "",
              transport_detail: "",
              total_night: 0,
              spd_number: "",
              is_valid: false,
            },
          ],
        };
      }
      return assignee;
    });
    onUpdateAssignees(updatedAssignees);
  };

  const addAssignee = () => {
    onUpdateAssignees([
      ...assignees,
      {
        name: "",
        spd_number: "",
        employee_number: "",
        position: "",
        rank: "",
        employee_id: "",
        transactions: [],
      },
    ]);
  };

  const deleteTransaction = (
    assigneeIndex: number,
    transactionIndex: number
  ) => {
    const updatedAssignees = assignees.map((assignee, aIdx) => {
      if (aIdx === assigneeIndex) {
        return {
          ...assignee,
          transactions: assignee.transactions.filter(
            (_, tIdx) => tIdx !== transactionIndex
          ),
        };
      }
      return assignee;
    });
    onUpdateAssignees(updatedAssignees);
  };

  const deleteAssignee = (assigneeIndex: number) => {
    onUpdateAssignees(assignees.filter((_, aIdx) => aIdx !== assigneeIndex));
  };

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount);
  };

  const formatRupiahInput = (value: string | number) => {
    const numValue =
      typeof value === "string"
        ? parseInt(value.replace(/\D/g, "")) || 0
        : value;
    return new Intl.NumberFormat("id-ID").format(numValue);
  };

  const calculateTotal = () => {
    const total = assignees.reduce((sumAssignee, assignee) => {
      return (
        sumAssignee +
        assignee.transactions.reduce((sumTransaction, transaction) => {
          return sumTransaction + transaction.subtotal;
        }, 0)
      );
    }, 0);
    return formatRupiah(total);
  };

  const updateSpdNumberForAssigneeTransactions = (
    assigneeIndex: number,
    value: string
  ) => {
    const updatedAssignees = assignees.map((assignee, aIdx) => {
      if (aIdx === assigneeIndex) {
        return {
          ...assignee,
          spd_number: value,
          transactions: assignee.transactions.map((transaction) => ({
            ...transaction,
            spd_number: value,
          })),
        };
      }
      return assignee;
    });
    onUpdateAssignees(updatedAssignees);
  };

  const getError = (index: number, field: string) => {
    return validationErrors.find(
      (e) => e.index === index && e.field === field
    );
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Transaksi</h2>
        <Button
          onClick={addAssignee}
          disabled={disabled}
          className="modern-btn-secondary"
          data-testid="button-add-assignee"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Data Pegawai
        </Button>
      </div>

      {assignees.map((assignee, assigneeIndex) => (
        <div key={assigneeIndex} className="mb-8 border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              Data Pegawai: {assignee.name || `Baru ${assigneeIndex + 1}`}
            </h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => deleteAssignee(assigneeIndex)}
              disabled={disabled}
              className="text-destructive hover:text-destructive"
              data-testid={`button-delete-assignee-${assigneeIndex}`}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama
              </label>
              <Input
                value={assignee.name}
                onChange={(e) =>
                  updateAssigneeField(assigneeIndex, "name", e.target.value)
                }
                disabled={disabled}
                placeholder="Nama Data Pegawai"
                className="h-9 text-sm border border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                data-testid={`input-assignee-name-${assigneeIndex}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                No. SPD
              </label>
              <Input
                value={assignee.spd_number}
                onChange={(e) =>
                  updateSpdNumberForAssigneeTransactions(
                    assigneeIndex,
                    e.target.value
                  )
                }
                disabled={disabled}
                placeholder="No. SPD"
                className="h-9 text-sm border border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                data-testid={`input-assignee-spd-${assigneeIndex}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIP
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <Input
                        value={assignee.employee_number}
                        onChange={(e) =>
                          updateAssigneeField(
                            assigneeIndex,
                            "employee_number",
                            e.target.value
                          )
                        }
                        disabled={disabled}
                        placeholder="NIP"
                        className={`h-9 text-sm border bg-white focus:ring-1 ${
                          getError(assigneeIndex, "employee_number")
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500 pr-10"
                            : "border-gray-300 focus:border-blue-400 focus:ring-blue-400"
                        }`}
                        data-testid={`input-assignee-employee-number-${assigneeIndex}`}
                      />
                      {getError(assigneeIndex, "employee_number") && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-red-500">
                          <AlertCircle className="h-5 w-5" />
                        </div>
                      )}
                    </div>
                  </TooltipTrigger>
                  {getError(assigneeIndex, "employee_number") && (
                    <TooltipContent className="bg-red-500 text-white border-red-600">
                      <p>{getError(assigneeIndex, "employee_number")?.message}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              {getError(assigneeIndex, "employee_number") && (
                 <p className="mt-1 text-xs text-red-500">
                   {getError(assigneeIndex, "employee_number")?.message}
                 </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jabatan
              </label>
              <Input
                value={assignee.position}
                onChange={(e) =>
                  updateAssigneeField(assigneeIndex, "position", e.target.value)
                }
                disabled={disabled}
                placeholder="Jabatan"
                className="h-9 text-sm border border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                data-testid={`input-assignee-position-${assigneeIndex}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Golongan
              </label>
              <Input
                value={assignee.rank}
                onChange={(e) =>
                  updateAssigneeField(assigneeIndex, "rank", e.target.value)
                }
                disabled={disabled}
                placeholder="Golongan"
                className="h-9 text-sm border border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                data-testid={`input-assignee-rank-${assigneeIndex}`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1800px] w-full modern-table">
              <thead>
                <tr>
                  <th className="whitespace-nowrap w-[9%]">Tipe</th>
                  <th className="whitespace-nowrap w-[10%]">Subtipe</th>
                  <th className="whitespace-nowrap w-[25%]">Deskripsi</th>
                  <th className="text-right whitespace-nowrap w-[10%]">
                    Jumlah (Rp)
                  </th>
                  <th className="text-right whitespace-nowrap w-[10%]">
                    Subtotal (Rp)
                  </th>
                  <th className="whitespace-nowrap w-[11%]">Tipe Pembayaran</th>
                  <th className="whitespace-nowrap w-[10%]">
                    Detail Transport
                  </th>
                  <th className="text-center whitespace-nowrap w-[5%]">
                    Hari/Malam
                  </th>
                  <th className="text-center whitespace-nowrap w-[5%]">
                    Valid?
                  </th>
                  <th className="text-center whitespace-nowrap w-[5%]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assignee.transactions.map((transaction, transactionIndex) => {
                  const isTransport =
                    transaction.type.toLowerCase() === "transport";
                  const isHotel = transaction.subtype.toLowerCase() === "hotel";
                  const isDailyAllowance =
                    transaction.subtype.toLowerCase() === "daily allowance";
                  const showTotalNight =
                    (transaction.total_night && transaction.total_night > 0) ||
                    isHotel ||
                    isDailyAllowance;
                  return (
                    <tr
                      key={transactionIndex}
                      className="transition-colors"
                      data-testid={`assignee-${assigneeIndex}-transaction-${transactionIndex}`}
                    >
                      <td className="whitespace-nowrap">
                        <Input
                          value={transaction.type}
                          onChange={(e) =>
                            updateTransaction(
                              assigneeIndex,
                              transactionIndex,
                              "type",
                              e.target.value
                            )
                          }
                          disabled={disabled}
                          placeholder="Tipe"
                          className="h-9 text-sm"
                          data-testid={`input-type-${assigneeIndex}-${transactionIndex}`}
                        />
                      </td>
                      <td className="whitespace-nowrap">
                        <Input
                          value={transaction.subtype}
                          onChange={(e) =>
                            updateTransaction(
                              assigneeIndex,
                              transactionIndex,
                              "subtype",
                              e.target.value
                            )
                          }
                          disabled={disabled}
                          placeholder="Subtipe"
                          className="h-9 text-sm"
                          data-testid={`input-subtype-${assigneeIndex}-${transactionIndex}`}
                        />
                      </td>
                      <td className="whitespace-nowrap w-[300px]">
                        <Input
                          value={transaction.description}
                          onChange={(e) =>
                            updateTransaction(
                              assigneeIndex,
                              transactionIndex,
                              "description",
                              e.target.value
                            )
                          }
                          disabled={disabled}
                          placeholder="Deskripsi"
                          className="h-9 text-sm"
                          data-testid={`input-description-${assigneeIndex}-${transactionIndex}`}
                        />
                      </td>
                      <td className="whitespace-nowrap">
                        <Input
                          value={
                            transaction.amount === 0
                              ? ""
                              : formatRupiahInput(transaction.amount)
                          }
                          onChange={(e) =>
                            updateTransaction(
                              assigneeIndex,
                              transactionIndex,
                              "amount",
                              e.target.value
                            )
                          }
                          disabled={disabled}
                          placeholder="0"
                          className="h-8 text-sm text-right font-mono border-none bg-transparent focus:ring-1 focus:ring-blue-400 rounded-none"
                          data-testid={`input-amount-${assigneeIndex}-${transactionIndex}`}
                        />
                      </td>
                      <td className="whitespace-nowrap">
                        {isDailyAllowance ? (
                          <div className="h-8 flex items-center justify-center">
                            <span className="text-sm font-mono text-right w-full pr-2">
                              {transaction.subtotal === 0
                                ? ""
                                : formatRupiahInput(transaction.subtotal)}
                            </span>
                          </div>
                        ) : (
                          <Input
                            value={
                              transaction.subtotal === 0
                                ? ""
                                : formatRupiahInput(transaction.subtotal)
                            }
                            onChange={(e) =>
                              updateTransaction(
                                assigneeIndex,
                                transactionIndex,
                                "subtotal",
                                e.target.value
                              )
                            }
                            disabled={disabled}
                            placeholder="0"
                            className="h-8 text-sm text-right font-mono border-none bg-transparent focus:ring-1 focus:ring-blue-400 rounded-none"
                            data-testid={`input-subtotal-${assigneeIndex}-${transactionIndex}`}
                          />
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        <Select
                          value={transaction.payment_type}
                          onValueChange={(value: PaymentType) =>
                            updateTransaction(
                              assigneeIndex,
                              transactionIndex,
                              "payment_type",
                              value
                            )
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger
                            className="h-9 text-sm rounded-md"
                            data-testid={`select-payment-type-${assigneeIndex}-${transactionIndex}`}
                          >
                            <SelectValue placeholder="Pilih tipe pembayaran" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="uang muka">Uang Muka</SelectItem>
                            <SelectItem value="rampung">Rampung</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="whitespace-nowrap">
                        {isTransport ? (
                          <Select
                            value={transaction.transport_detail}
                            onValueChange={(value) =>
                              updateTransaction(
                                assigneeIndex,
                                transactionIndex,
                                "transport_detail",
                                value
                              )
                            }
                            disabled={disabled}
                          >
                            <SelectTrigger
                              className="h-9 text-sm rounded-md"
                              data-testid={`select-transport-detail-${assigneeIndex}-${transactionIndex}`}
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
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="whitespace-nowrap">
                        {showTotalNight ? (
                          <Input
                            value={transaction.total_night || ""}
                            onChange={(e) =>
                              updateTransaction(
                                assigneeIndex,
                                transactionIndex,
                                "total_night",
                                e.target.value
                              )
                            }
                            disabled={disabled}
                            placeholder={isHotel ? "Jml malam" : "Jml hari"}
                            className="h-9 text-sm text-center"
                            type="number"
                            min="0"
                            data-testid={`input-total-night-${assigneeIndex}-${transactionIndex}`}
                          />
                        ) : (
                          <div className="h-8 flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              -
                            </span>
                          </div>
                        )}

                      </td>
                      <td className="text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={transaction.is_valid ?? false}
                            onCheckedChange={(checked) =>
                              updateTransaction(
                                assigneeIndex,
                                transactionIndex,
                                "is_valid",
                                checked === true
                              )
                            }
                            disabled={disabled}
                            data-testid={`checkbox-is-valid-${assigneeIndex}-${transactionIndex}`}
                          />
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            deleteTransaction(assigneeIndex, transactionIndex)
                          }
                          disabled={disabled}
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          data-testid={`button-delete-transaction-${assigneeIndex}-${transactionIndex}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td
                    colSpan={3}
                    className="py-4 px-4 text-sm font-semibold text-right whitespace-nowrap"
                  >
                    Total Transaksi untuk {assignee.name || "Data Pegawai Baru"}
                  </td>
                  <td
                    colSpan={2}
                    className="py-4 px-4 text-sm font-bold text-right font-mono whitespace-nowrap text-blue-600"
                    data-testid={`text-total-assignee-${assigneeIndex}`}
                  >
                    Rp{" "}
                    {formatRupiah(
                      assignee.transactions.reduce(
                        (sum, t) => sum + t.subtotal,
                        0
                      )
                    )}
                  </td>
                  <td colSpan={5} className="whitespace-nowrap"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => addTransaction(assigneeIndex)}
              disabled={disabled}
              className="modern-btn-secondary"
              data-testid={`button-add-transaction-${assigneeIndex}`}
            >
              <Plus className="w-4 h-4 mr-2" />
              Tambah Transaksi
            </Button>
          </div>
        </div>
      ))}

      {assignees.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">
            Belum ada data pegawai. Tambah data pegawai secara manual.
          </p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">Total Keseluruhan</h2>
          <span className="text-xl font-bold font-mono">
            Rp {calculateTotal()}
          </span>
        </div>
      </div>
    </Card>
  );
}
