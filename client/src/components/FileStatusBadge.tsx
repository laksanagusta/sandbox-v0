import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Clock, Link } from "lucide-react";

export type FileStatus = "pending" | "found" | "missing" | "linked";

interface FileStatusBadgeProps {
  status: FileStatus;
  filesCount?: number;
  className?: string;
}

export function FileStatusBadge({ status, filesCount, className }: FileStatusBadgeProps) {
  const statusConfig: Record<FileStatus, {
    icon: React.ReactNode;
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }> = {
    linked: {
      icon: <CheckCircle className="w-3 h-3" />,
      label: filesCount !== undefined ? `Linked (${filesCount})` : "Linked",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      borderColor: "border-green-200",
    },
    found: {
      icon: <Link className="w-3 h-3" />,
      label: filesCount !== undefined ? `Found (${filesCount})` : "Found",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      borderColor: "border-blue-200",
    },
    missing: {
      icon: <AlertTriangle className="w-3 h-3" />,
      label: "Missing",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      borderColor: "border-amber-200",
    },
    pending: {
      icon: <Clock className="w-3 h-3" />,
      label: "Pending",
      bgColor: "bg-muted/50",
      textColor: "text-muted-foreground",
      borderColor: "border-border",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge
      variant="outline"
      className={`
        flex items-center gap-1.5 px-2.5 py-1
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        font-medium text-xs
        ${className || ""}
      `}
    >
      {config.icon}
      <span>{config.label}</span>
    </Badge>
  );
}

export default FileStatusBadge;
