import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import UploadForm from '@/components/UploadForm';
import ActivityForm from '@/components/ActivityForm';
import EditableTable from '@/components/EditableTable';
import { useToast } from '@/hooks/use-toast';

interface ActivityData {
  start_date: string;
  end_date: string;
  destination: string;
}

interface Transaction {
  name: string;
  type: string;
  subtype: string;
  amount: string;
  total_night: string;
  transport_detail?: string;
}

export default function KwitansiPage() {
  const { toast } = useToast();
  const [activity, setActivity] = useState<ActivityData>({
    start_date: '',
    end_date: '',
    destination: '',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const handleUploaded = (data: any[]) => {
    // Normalize data - ensure all required fields exist with defaults
    const normalized = data.map(item => ({
      name: item.name || '',
      type: item.type || '',
      subtype: item.subtype || '',
      amount: item.amount || '',
      total_night: item.total_night || '',
      transport_detail: item.transport_detail || '',
    }));
    
    setTransactions(normalized);
    toast({
      title: 'Berhasil!',
      description: `${normalized.length} transaksi berhasil dimuat dari file.`,
    });
  };

  const handleSaveExport = () => {
    const payload = {
      activity,
      transactions,
    };

    console.log('=== DATA KWITANSI ===');
    console.log(JSON.stringify(payload, null, 2));
    console.log('====================');

    toast({
      title: 'Data Tersimpan!',
      description: 'Data telah dicetak ke console. Buka DevTools untuk melihat.',
    });
  };

  return (
    <div className="bg-background">
      {/* Header with Title and Save Button */}
      <div className="border-b bg-card sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold" data-testid="text-title">
              MVP Kwitansi PNS
            </h1>
            <Button onClick={handleSaveExport} data-testid="button-save-export">
              <Save className="w-4 h-4 mr-2" />
              Simpan / Export
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
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
            <EditableTable rows={transactions} setRows={setTransactions} />
          </div>
        </div>
      </div>
    </div>
  );
}
