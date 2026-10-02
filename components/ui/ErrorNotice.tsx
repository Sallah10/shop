import type { ReactNode } from "react";

export function ErrorNotice({
  title = "Something went wrong",
  message,
  action,
}: {
  title?: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900"
    >
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-red-800">{message}</p>
      </div>
      {action}
    </div>
  );
}
