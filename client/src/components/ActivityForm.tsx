import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatDateToString, parseDateFromString } from "@/lib/utils";

/**
 * Props for the ActivityForm component.
 */
interface ActivityData {
  start_date: string;
  end_date: string;
  destination: string;
  destination_city: string;
  spd_date: string;
  departure_date: string;
  return_date: string;
  receipt_sign_date: string;
}

interface ActivityFormProps {
  activity: ActivityData;
  onChange: (activity: ActivityData) => void;
  errors?: Partial<Record<keyof ActivityData, string>>; // Add errors prop
}

export default function ActivityForm({
  activity,
  onChange,
  errors,
}: ActivityFormProps) {
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
            onChange={(e) => handleChange("start_date", e.target.value)}
            className={`w-full ${
              errors?.start_date
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-start-date"
          />
          {errors?.start_date && (
            <p className="text-sm text-destructive">{errors.start_date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date" className="text-sm font-medium">
            Tanggal Selesai Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="end_date"
            type="date"
            value={activity.end_date}
            onChange={(e) => handleChange("end_date", e.target.value)}
            className={`w-full ${
              errors?.end_date
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-end-date"
          />
          {errors?.end_date && (
            <p className="text-sm text-destructive">{errors.end_date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sm font-medium">
            Tujuan Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="destination"
            type="text"
            value={activity.destination}
            onChange={(e) => handleChange("destination", e.target.value)}
            placeholder="Contoh: Jakarta"
            className={`w-full ${
              errors?.destination
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-destination"
          />
          {errors?.destination && (
            <p className="text-sm text-destructive">{errors.destination}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination_city" className="text-sm font-medium">
            Kota Tujuan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="destination_city"
            type="text"
            value={activity.destination_city}
            onChange={(e) => handleChange("destination_city", e.target.value)}
            placeholder="Contoh: Jakarta"
            className={`w-full ${
              errors?.destination_city
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-destination-city"
          />
          {errors?.destination_city && (
            <p className="text-sm text-destructive">
              {errors.destination_city}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="spd_date" className="text-sm font-medium">
            Tanggal SPD <span className="text-destructive">*</span>
          </Label>
          <Input
            id="spd_date"
            type="date"
            value={activity.spd_date}
            onChange={(e) => handleChange("spd_date", e.target.value)}
            className={`w-full ${
              errors?.spd_date
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-spd-date"
          />
          {errors?.spd_date && (
            <p className="text-sm text-destructive">{errors.spd_date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="departure_date" className="text-sm font-medium">
            Tanggal Berangkat <span className="text-destructive">*</span>
          </Label>
          <Input
            id="departure_date"
            type="date"
            value={activity.departure_date}
            onChange={(e) => handleChange("departure_date", e.target.value)}
            className={`w-full ${
              errors?.departure_date
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-departure-date"
          />
          {errors?.departure_date && (
            <p className="text-sm text-destructive">{errors.departure_date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="return_date" className="text-sm font-medium">
            Tanggal Pulang <span className="text-destructive">*</span>
          </Label>
          <Input
            id="return_date"
            type="date"
            value={activity.return_date}
            onChange={(e) => handleChange("return_date", e.target.value)}
            className={`w-full ${
              errors?.return_date
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-return-date"
          />
          {errors?.return_date && (
            <p className="text-sm text-destructive">{errors.return_date}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="receipt_sign_date" className="text-sm font-medium">
            Tanggal TTD Kwitansi <span className="text-destructive">*</span>
          </Label>
          <Input
            id="receipt_sign_date"
            type="date"
            value={activity.receipt_sign_date}
            onChange={(e) => handleChange("receipt_sign_date", e.target.value)}
            className={`w-full ${
              errors?.receipt_sign_date
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-receipt-sign-date"
          />
          {errors?.receipt_sign_date && (
            <p className="text-sm text-destructive">
              {errors.receipt_sign_date}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
