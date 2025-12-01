import { BusinessTripStatus } from "@/components/BusinessTripTable";

/**
 * Validates if a status transition is allowed
 * @param currentStatus Current status of the business trip
 * @param newStatus Desired new status
 * @returns true if transition is allowed, false otherwise
 */
export const validateStatusTransition = (
  currentStatus: BusinessTripStatus,
  newStatus: BusinessTripStatus
): boolean => {
  // Same status is always allowed
  if (currentStatus === newStatus) {
    return true;
  }

  // Once completed, cannot change to any other status
  if (currentStatus === 'completed') {
    return false;
  }

  // Canceled cannot be changed to any other status
  if (currentStatus === 'canceled') {
    return false;
  }

  // Define allowed transitions
  const allowedTransitions: Record<BusinessTripStatus, BusinessTripStatus[]> = {
    draft: ['ongoing', 'canceled'],
    ongoing: ['ready_to_verify', 'completed', 'draft', 'canceled'],
    ready_to_verify: ['completed', 'ongoing', 'canceled'],
    completed: [], // No transitions allowed from completed
    canceled: [], // No transitions allowed from canceled
  };

  return allowedTransitions[currentStatus].includes(newStatus);
};

/**
 * Gets next available statuses for a given current status
 * @param currentStatus Current status of the business trip
 * @returns Array of allowed next statuses
 */
export const getNextAvailableStatuses = (
  currentStatus: BusinessTripStatus
): BusinessTripStatus[] => {
  // Always include current status
  const statuses: BusinessTripStatus[] = [currentStatus];

  // Define allowed transitions (excluding current status)
  const allowedTransitions: Record<BusinessTripStatus, BusinessTripStatus[]> = {
    draft: ['ongoing', 'canceled'],
    ongoing: ['ready_to_verify', 'completed', 'draft', 'canceled'],
    ready_to_verify: ['completed', 'ongoing', 'canceled'],
    completed: [],
    canceled: [],
  };

  return [...statuses, ...allowedTransitions[currentStatus]];
};

/**
 * Determines initial status for a new business trip
 * @param hasAssignees Whether the business trip has assignees
 * @returns Initial status
 */
export const getInitialStatus = (hasAssignees: boolean): BusinessTripStatus => {
  return hasAssignees ? 'ongoing' : 'draft';
};

/**
 * Gets human readable description for status
 * @param status Business trip status
 * @returns Human readable status description
 */
export const getStatusDescription = (status: BusinessTripStatus): string => {
  const descriptions: Record<BusinessTripStatus, string> = {
    draft: 'Draft - Business trip baru dibuat',
    ongoing: 'Ongoing - Sedang berjalan',
    ready_to_verify: 'Ready to Verify - Siap untuk diverifikasi',
    completed: 'Completed - Telah selesai',
    canceled: 'Canceled - Dibatalkan',
  };

  return descriptions[status] || status;
};