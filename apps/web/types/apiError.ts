// lib/handle-api-error.ts
import { AxiosError } from "axios";

export function handleApiError(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data;

    // FastAPI 422 — validation error shape: { detail: [{ msg, loc }] }
    if (status === 422 && Array.isArray(data?.detail)) {
      const messages = data.detail
        .map(
          (e: { msg: string; loc: string[] }) =>
            `${e.loc?.slice(1).join(".")} — ${e.msg}`,
        )
        .join(", ");
      throw new Error(messages);
    }

    // your ApiResponse error shape
    const message = data?.message || error.message || "Request failed";
    throw new Error(message);
  }

  throw new Error(error instanceof Error ? error.message : "Unknown error");
}
