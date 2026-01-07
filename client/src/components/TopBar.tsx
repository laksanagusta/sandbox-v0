import { } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

export function TopBar() {
  const { user } = useAuth();

  return (
    <header className="h-12 bg-sidebar flex items-center justify-end pl-[15rem] pr-4 shrink-0">

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <ThemeToggle />
        

        
        {/* User avatar */}
        <div 
          className="w-7 h-7 rounded-full ml-1 cursor-pointer"
          style={{
            background: user?.avatar_gradient_start && user?.avatar_gradient_end
              ? `linear-gradient(135deg, ${user.avatar_gradient_start} 0%, ${user.avatar_gradient_end} 100%)`
              : 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)'
          }}
        />
      </div>
    </header>
  );
}
