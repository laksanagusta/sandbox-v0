import { UserCheck } from "lucide-react";
import { PendingUserTable } from "@/components/PendingUserTable";

export default function PendingUsersPage() {
  return (
    <div className="bg-background min-h-screen flex flex-col">
      <PendingUserTable className="flex-1" />
    </div>
  );
}
