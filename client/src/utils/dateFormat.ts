import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Format date string to "dd MMM yyyy" format (e.g., "01 Jan 2023")
 * @param dateString - Date string to format
 * @returns Formatted date string or "-" if invalid
 */
export const formatDate = (dateString: string): string => {
  try {
    return format(new Date(dateString), "dd MMM yyyy", { locale: id });
  } catch (error) {
    return "-";
  }
};

/**
 * Format date string to "dd MMM yyyy, HH:mm" format (e.g., "01 Jan 2023, 14:30")
 * @param dateString - Date string to format
 * @returns Formatted date time string or "-" if invalid
 */
export const formatDateTime = (dateString: string): string => {
  try {
    return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: id });
  } catch (error) {
    return "-";
  }
};

/**
 * Get signed at timestamp with fallback to signature_data timestamp
 * @param signature - WorkPaperSignature object
 * @returns Formatted timestamp string or "-" if both are empty
 */
export const getSignedAtTimestamp = (signature: {
  signed_at?: string;
  signature_data?: {
    timestamp?: string;
  };
}): string => {
  if (signature.signed_at) {
    return formatDateTime(signature.signed_at);
  }

  if (signature.signature_data?.timestamp) {
    return formatDateTime(signature.signature_data.timestamp);
  }

  return "-";
};