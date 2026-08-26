export type ActionState = { ok: boolean; message: string };
export const initialActionState: ActionState = { ok: false, message: "" };

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
