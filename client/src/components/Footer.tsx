import { Separator } from "@/components/ui/separator";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-12">
      <Separator className="mb-6" />
      <div className="text-center text-sm text-muted-foreground space-y-1 pb-8">
        <p>© {currentYear} laksanagusta. All rights reserved.</p>
      </div>
    </footer>
  );
}
