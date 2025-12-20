import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserTable } from "@/components/UserTable";

export default function UserPage() {
  const [, setLocation] = useLocation();

  const handleCreateUser = () => {
    setLocation("/users/new");
  };

  return (
    <div className="bg-background min-h-screen flex flex-col">
      <UserTable className="flex-1" onCreate={handleCreateUser} />
    </div>
  );
}