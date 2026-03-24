import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-background p-5">
      <div className="text-center">
        <div className="mx-auto w-14 h-14 rounded-lg bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground mb-2">404</h1>
        <p className="text-sm text-muted-foreground mb-6">Page not found</p>
        <Button onClick={() => setLocation("/")} className="h-11 rounded text-sm">
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
