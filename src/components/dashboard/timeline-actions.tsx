"use client";

import { MoreHorizontal, RefreshCw, Trash2 } from "lucide-react";
import { deleteLogAction, repeatMealAction } from "@/app/actions/logs";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function TimelineActions({ id, kind }: { id: string; kind: "meal" | "hydration" | "activity" }) {
  const table = kind === "meal" ? "meal_logs" : kind === "hydration" ? "hydration_logs" : "activity_logs";
  return <AlertDialog><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Entry actions"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end">{kind === "meal" && <form action={repeatMealAction}><input type="hidden" name="id" value={id} /><DropdownMenuItem asChild><button type="submit" className="w-full"><RefreshCw /> Log again</button></DropdownMenuItem></form>}<AlertDialogTrigger asChild><DropdownMenuItem onSelect={(event) => event.preventDefault()} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem></AlertDialogTrigger></DropdownMenuContent></DropdownMenu><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this entry?</AlertDialogTitle><AlertDialogDescription>This permanently removes the log. If the day was finished, its review will be recalculated immediately.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep entry</AlertDialogCancel><form action={deleteLogAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="table" value={table} /><AlertDialogAction type="submit" variant="destructive">Delete</AlertDialogAction></form></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}
