"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SubmitButton({ children, pendingLabel = "Saving…", ...props }: ComponentProps<typeof Button> & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending || props.disabled} {...props}>{pending && <LoaderCircle className="animate-spin" />}{pending ? pendingLabel : children}</Button>;
}
