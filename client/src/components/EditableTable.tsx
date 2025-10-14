import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Transaction {
  name: string;
  type: string;
  subtype: string;
  amount: string;
  total_night: string;
  transport_detail?: string;
}

interface EditableTableProps {
  rows: Transaction[];
  setRows: (rows: Transaction[]) => void;
}

export default function EditableTable({ rows, setRows }: EditableTableProps) {
  const updateRow = (index: number, field: keyof Transaction, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        name: '',
        type: '',
        subtype: '',
        amount: '',
        total_night: '',
        transport_detail: '',
      },
    ]);
  };

  const deleteRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const formatRupiah = (amount: string) => {
    const number = parseInt(amount.replace(/\D/g, '')) || 0;
    return new Intl.NumberFormat('id-ID').format(number);
  };

  const calculateTotal = () => {
    const total = rows.reduce((sum, row) => {
      const amount = parseInt(row.amount.replace(/\D/g, '')) || 0;
      return sum + amount;
    }, 0);
    return formatRupiah(total.toString());
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold">Transaksi</h2>
        <Button onClick={addRow} variant="outline" size="sm" data-testid="button-add-row">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Baris
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b">
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2">Nama</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2">Tipe</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2">Subtipe</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide py-3 px-2">Jumlah (Rp)</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide py-3 px-2">Total Malam</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide py-3 px-2">Detail Transport</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide py-3 px-2 w-20">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isTransport = row.type.toLowerCase() === 'transport';
              
              return (
                <tr key={index} className="border-b hover:bg-muted/30 transition-colors" data-testid={`row-${index}`}>
                  <td className="py-2 px-2">
                    <Input
                      value={row.name}
                      onChange={(e) => updateRow(index, 'name', e.target.value)}
                      placeholder="Nama"
                      className="h-8 text-sm"
                      data-testid={`input-name-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={row.type}
                      onChange={(e) => updateRow(index, 'type', e.target.value)}
                      placeholder="Tipe"
                      className="h-8 text-sm"
                      data-testid={`input-type-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={row.subtype}
                      onChange={(e) => updateRow(index, 'subtype', e.target.value)}
                      placeholder="Subtipe"
                      className="h-8 text-sm"
                      data-testid={`input-subtype-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={row.amount}
                      onChange={(e) => updateRow(index, 'amount', e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm text-right font-mono"
                      data-testid={`input-amount-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input
                      value={row.total_night}
                      onChange={(e) => updateRow(index, 'total_night', e.target.value)}
                      placeholder="0"
                      className="h-8 text-sm text-center"
                      data-testid={`input-total-night-${index}`}
                    />
                  </td>
                  <td className="py-2 px-2">
                    {isTransport ? (
                      <Select 
                        value={row.transport_detail || ''} 
                        onValueChange={(value) => updateRow(index, 'transport_detail', value)}
                      >
                        <SelectTrigger className="h-8 text-sm" data-testid={`select-transport-detail-${index}`}>
                          <SelectValue placeholder="Pilih detail" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="transport_asal">Transport Asal</SelectItem>
                          <SelectItem value="transport_daerah">Transport Daerah</SelectItem>
                          <SelectItem value="transport_darat">Transport Darat</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="h-8 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">-</span>
                      </div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center">
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
              <td colSpan={3} className="py-3 px-2 text-sm font-semibold text-right">
                Total
              </td>
              <td className="py-3 px-2 text-sm font-semibold text-right font-mono" data-testid="text-total">
                Rp {calculateTotal()}
              </td>
              <td colSpan={3}></td>
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
