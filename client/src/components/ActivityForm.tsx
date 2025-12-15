import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { formatDateToString, parseDateFromString } from "@/lib/utils";

interface ActivityFormPropsData {
  businessTripNumber?: string;
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

interface ActivityFormProps {
  activity: ActivityFormPropsData;
  onChange: (activity: ActivityFormPropsData) => void;
  errors?: Partial<Record<keyof ActivityFormPropsData, string>>; // Add errors prop
  disabled?: boolean;
  isDocumentLinkEnabled?: boolean;
}

export default function ActivityForm({
  activity,
  onChange,
  errors,
  disabled = false,
  isDocumentLinkEnabled = false,
}: ActivityFormProps) {
  const handleChange = (field: keyof ActivityFormPropsData, value: string) => {
    onChange({
      ...activity,
      [field]: value,
    });
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Detail Kegiatan</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="businessTripNumber" className="text-sm font-medium">
            No. Business Trip
          </Label>
          <Input
            id="businessTripNumber"
            type="text"
            value={activity.businessTripNumber || ""}
            disabled
            className="w-full bg-gray-50 text-gray-700 font-mono"
            placeholder="BT-0000"
            data-testid="input-business-trip-number"
          />
          <p className="text-xs text-gray-500">Nomor business trip digenerate otomatis oleh sistem</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-medium">
            Tanggal Mulai Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="startDate"
            type="date"
            value={activity.startDate}
            onChange={(e) => handleChange("startDate", e.target.value)}
            disabled={disabled}
            className={`w-full ${
              errors?.startDate
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-start-date"
          />
          {errors?.startDate && (
            <p className="text-sm text-destructive">{errors.startDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-medium">
            Tanggal Selesai Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            value={activity.endDate}
            onChange={(e) => handleChange("endDate", e.target.value)}
            disabled={disabled}
            className={`w-full ${
              errors?.endDate
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-end-date"
          />
          {errors?.endDate && (
            <p className="text-sm text-destructive">{errors.endDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="activityPurpose" className="text-sm font-medium">
            Tujuan Kegiatan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="activityPurpose"
            type="text"
            value={activity.activityPurpose}
            onChange={(e) => handleChange("activityPurpose", e.target.value)}
            disabled={disabled}
            placeholder="Contoh: Monitoring and Evaluation"
            className={`w-full ${
              errors?.activityPurpose
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-activity-purpose"
          />
          {errors?.activityPurpose && (
            <p className="text-sm text-destructive">{errors.activityPurpose}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="destinationCity" className="text-sm font-medium">
            Kota Tujuan <span className="text-destructive">*</span>
          </Label>
          <Input
            id="destinationCity"
            type="text"
            value={activity.destinationCity}
            onChange={(e) => handleChange("destinationCity", e.target.value)}
            disabled={disabled}
            placeholder="Contoh: Balikpapan"
            className={`w-full ${
              errors?.destinationCity
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-destination-city"
          />
          {errors?.destinationCity && (
            <p className="text-sm text-destructive">{errors.destinationCity}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="spdDate" className="text-sm font-medium">
            Tanggal SPD <span className="text-destructive">*</span>
          </Label>
          <Input
            id="spdDate"
            type="date"
            value={activity.spdDate}
            onChange={(e) => handleChange("spdDate", e.target.value)}
            disabled={disabled}
            className={`w-full ${
              errors?.spdDate
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-spd-date"
          />
          {errors?.spdDate && (
            <p className="text-sm text-destructive">{errors.spdDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="departureDate" className="text-sm font-medium">
            Tanggal Berangkat <span className="text-destructive">*</span>
          </Label>
          <Input
            id="departureDate"
            type="date"
            value={activity.departureDate}
            onChange={(e) => handleChange("departureDate", e.target.value)}
            disabled={disabled}
            className={`w-full ${
              errors?.departureDate
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-departure-date"
          />
          {errors?.departureDate && (
            <p className="text-sm text-destructive">{errors.departureDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="returnDate" className="text-sm font-medium">
            Tanggal Pulang <span className="text-destructive">*</span>
          </Label>
          <Input
            id="returnDate"
            type="date"
            value={activity.returnDate}
            onChange={(e) => handleChange("returnDate", e.target.value)}
            disabled={disabled}
            className={`w-full ${
              errors?.returnDate
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-return-date"
          />
          {errors?.returnDate && (
            <p className="text-sm text-destructive">{errors.returnDate}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="receiptSignatureDate" className="text-sm font-medium">
            Tanggal TTD Kwitansi <span className="text-destructive">*</span>
          </Label>
          <Input
            id="receiptSignatureDate"
            type="date"
            value={activity.receiptSignatureDate}
            onChange={(e) =>
              handleChange("receiptSignatureDate", e.target.value)
            }
            disabled={disabled}
            className={`w-full ${
              errors?.receiptSignatureDate
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
            data-testid="input-receipt-signature-date"
          />
          {errors?.receiptSignatureDate && (
            <p className="text-sm text-destructive">
              {errors.receiptSignatureDate}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="documentLink" className="text-sm font-medium">
          Link Dokumen
        </Label>
        <Input
          id="documentLink"
          type="url"
          value={activity.documentLink || ""}
          onChange={(e) => handleChange("documentLink", e.target.value)}
          disabled={disabled && !isDocumentLinkEnabled}
          placeholder="https://drive.google.com/..."
          className={`w-full ${
            errors?.documentLink
              ? "border-destructive focus-visible:ring-destructive"
              : ""
          }`}
          data-testid="input-document-link"
        />
        {errors?.documentLink && (
          <p className="text-sm text-destructive">{errors.documentLink}</p>
        )}
        {activity.documentLink && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-blue-600 hover:text-blue-800">
              <a
                href={activity.documentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Preview Document
              </a>
            </span>
          </div>
        )}
      </div>
    </Card>
  );
}
