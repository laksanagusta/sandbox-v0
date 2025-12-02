import { useState, useEffect } from "react";
import { Building } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OrganizationBadgeProps {
  organizationId: string;
  showIcon?: boolean;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export function OrganizationBadge({
  organizationId,
  showIcon = true,
  className = "",
  variant = "outline",
}: OrganizationBadgeProps) {
  const [organizationName, setOrganizationName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (!organizationId) return;

      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");
        // We use the identity URL (port 5001) for organizations
        const baseUrl = import.meta.env.VITE_API_IDENTITY_URL || "http://localhost:5001";
        
        const response = await fetch(
          `${baseUrl}/api/v1/organizations/${organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setOrganizationName(data.data?.name || "Unknown Organization");
        } else {
          setOrganizationName(organizationId); // Fallback to ID
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        setOrganizationName(organizationId); // Fallback to ID
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizationName();
  }, [organizationId]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showIcon && <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />}
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && <Building className="w-4 h-4 text-gray-500" />}
      <span className="font-medium text-sm text-gray-700">
        {organizationName}
      </span>
    </div>
  );
}
