"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <Alert variant="destructive" className="mx-auto max-w-xl"><AlertCircle /><AlertTitle>We couldn’t load this view</AlertTitle><AlertDescription className="space-y-3"><p>Your saved data is unchanged. Check your connection and try again.</p><Button variant="outline" onClick={reset}>Try again</Button></AlertDescription></Alert>;
}
