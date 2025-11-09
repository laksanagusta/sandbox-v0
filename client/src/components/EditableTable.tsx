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
import { Assignee, PaymentType, Transaction } from "@shared/types";

interface EditableTableProps {
  assignees: Assignee[];
  onUpdateAssignees: (assignees: Assignee[]) => void;
}

export default function EditableTable({
  assignees,
  onUpdateAssignees,
}: EditableTableProps) {
  const updateTransaction = (
    assigneeIndex: number,
    transactionIndex: number,
    field: keyof Transaction,
    value: string | number
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

              // For daily allowance, calculate subtotal automatically
              const isDailyAllowance =
                transaction.type.toLowerCase() === "daily allowance" ||
                transaction.type.toLowerCase() === "daily" ||
                transaction.subtype.toLowerCase() === "daily allowance" ||
                transaction.subtype.toLowerCase() === "daily";

              if (isDailyAllowance) {
                // Calculate days from description or use a default
                const days =
                  typeof transaction.total_night === "number"
                    ? transaction.total_night
                    : 1;

                if (field === "amount") {
                  // Update amount and recalculate subtotal
                  return {
                    ...transaction,
                    amount: numValue,
                    subtotal: numValue * days,
                  };
                } else if (field === "total_night") {
                  // Update days and recalculate subtotal
                  return {
                    ...transaction,
                    total_night: numValue,
                    subtotal: transaction.amount * numValue,
                  };
                } else {
                  // Update other fields (use appropriate value type)
                  const isStringField = field === "payment_type" ||
                    field === "transport_detail" ||
                    field === "type" ||
                    field === "subtype" ||
                    field === "description" ||
                    field === "spd_number";

                  return {
                    ...transaction,
                    [field]: isStringField ? stringValue : numValue,
                  };
                }
              }

              // For other transaction types, update normally (use appropriate value type)
              const isStringField = field === "payment_type" ||
                field === "transport_detail" ||
                field === "type" ||
                field === "subtype" ||
                field === "description" ||
                field === "spd_number";

              return {
                ...transaction,
                [field]: isStringField ? stringValue : numValue,
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
              type: "",
              subtype: "",
              amount: 0,
              subtotal: 0,
              payment_type: "uang muka" as PaymentType,
              description: "",
              transport_detail: "",
              total_night: 0,
              spd_number: "",
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
        employee_id: "",
        position: "",
        rank: "",
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

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Transaksi</h2>
        <Button
          onClick={addAssignee}
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
                placeholder="No. SPD"
                className="h-9 text-sm border border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                data-testid={`input-assignee-spd-${assigneeIndex}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NIP
              </label>
              <Input
                value={assignee.employee_id}
                onChange={(e) =>
                  updateAssigneeField(
                    assigneeIndex,
                    "employee_id",
                    e.target.value
                  )
                }
                placeholder="NIP"
                className="h-9 text-sm border border-gray-300 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                data-testid={`input-assignee-employee-id-${assigneeIndex}`}
              />
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
                  <th className="whitespace-nowrap w-[10%]">Tipe</th>
                  <th className="whitespace-nowrap w-[12%]">Subtipe</th>
                  <th className="whitespace-nowrap w-[28%]">Deskripsi</th>
                  <th className="text-right whitespace-nowrap w-[10%]">
                    Jumlah (Rp)
                  </th>
                  <th className="text-right whitespace-nowrap w-[10%]">
                    Subtotal (Rp)
                  </th>
                  <th className="whitespace-nowrap w-[12%]">Tipe Pembayaran</th>
                  <th className="whitespace-nowrap w-[10%]">
                    Detail Transport
                  </th>
                  <th className="text-center whitespace-nowrap w-[6%]">
                    Hari/Malam
                  </th>
                  <th className="text-center whitespace-nowrap w-[6%]">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {assignee.transactions.map((transaction, transactionIndex) => {
                  const isTransport =
                    transaction.type.toLowerCase() === "transport";
                  const isHotel = transaction.subtype.toLowerCase() === "hotel";
                  const isDailyAllowance =
                    transaction.subtype.toLowerCase() === "daily allowance";
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
                        {isHotel || isDailyAllowance ? (
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
                      <td className="py-2 px-2 text-center whitespace-nowrap">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            deleteTransaction(assigneeIndex, transactionIndex)
                          }
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
                  <td colSpan={4} className="whitespace-nowrap"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              onClick={() => addTransaction(assigneeIndex)}
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
