import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface LLMDisclaimerProps {
  variant?: "default" | "minimal";
  className?: string;
}

export default function LLMDisclaimer({
  variant = "default",
  className,
}: LLMDisclaimerProps) {
  if (variant === "minimal") {
    return (
      <div className={`text-xs text-muted-foreground text-center ${className}`}>
        <p>Powered by AI - Harap verifikasi informasi penting.</p>
      </div>
    );
  }

  return (
    <Alert className={`border-amber-200 bg-amber-50 ${className}`}>
      <Info className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-sm text-amber-800">
        <div className="space-y-1">
          <p className="font-medium">Pemberitahuan</p>
          <p>
            Aplikasi ini menggunakan teknologi AI. Hasil yang dihasilkan mungkin
            mengandung ketidakakuratan. Harap verifikasi informasi penting.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
