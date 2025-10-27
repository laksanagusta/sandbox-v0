import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto">
      <Separator className="mb-4" />
      <div className="text-center text-sm text-muted-foreground space-y-1">
        <p>© {currentYear} Laksanagusta. All rights reserved.</p>
      </div>
    </footer>
  );
}