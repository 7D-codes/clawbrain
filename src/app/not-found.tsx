import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        {/* Error code */}
        <div className="flex items-center justify-center w-20 h-20 border border-border bg-secondary">
          <span className="font-mono text-3xl font-bold text-foreground">404</span>
        </div>

        {/* Title */}
        <h1 className="text-xl font-semibold text-foreground">
          Page not found
        </h1>

        {/* Description */}
        <p className="text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <Link 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go home
          </Link>
          
          <a 
            href="/"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-border text-foreground text-sm font-medium hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </a>
        </div>
      </div>
    </div>
  );
}
