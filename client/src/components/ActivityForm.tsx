import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

interface ActivityData {
  start_date: string;
  end_date: string;
  destination: string;
}

interface ActivityFormProps {
  activity: ActivityData;
  onChange: (activity: ActivityData) => void;
}

export default function ActivityForm({ activity, onChange }: ActivityFormProps) {
  const handleChange = (field: keyof ActivityData, value: string) => {
    onChange({
      ...activity,
      [field]: value,
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Detail Kegiatan</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-sm font-medium">
            Tanggal Mulai Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="start_date"
            type="date"
            value={activity.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            className="w-full"
            data-testid="input-start-date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date" className="text-sm font-medium">
            Tanggal Selesai Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="end_date"
            type="date"
            value={activity.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            className="w-full"
            data-testid="input-end-date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sm font-medium">
            Tujuan Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="destination"
            type="text"
            value={activity.destination}
            onChange={(e) => handleChange('destination', e.target.value)}
            placeholder="Contoh: Jakarta"
            className="w-full"
            data-testid="input-destination"
          />
        </div>
      </div>
    </Card>
  );
}
