"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { updateOrderStatus, type OrderStatusState } from "@/app/admin/actions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import { useToast } from "@/components/ui/toast/ToastProvider";

const initialState: OrderStatusState = { error: null, status: null };

const tones: Record<OrderStatus, { pill: string; dot: string }> = {
  pending: { pill: "border-amber-200 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  paid: { pill: "border-sky-200 bg-sky-50 text-sky-900", dot: "bg-sky-500" },
  shipped: { pill: "border-emerald-200 bg-emerald-50 text-emerald-900", dot: "bg-emerald-500" },
  cancelled: { pill: "border-zinc-300 bg-zinc-100 text-zinc-700", dot: "bg-zinc-400" },
};

export function OrderStatusSelect({ orderId, status }: { orderId: string; status: string }) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(updateOrderStatus, initialState);
  const [value, setValue] = useState(status);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [syncedStatus, setSyncedStatus] = useState(status);

  const formRef = useRef<HTMLFormElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);

  // Resync when the server sends a new status, which happens after the action
  // revalidates: a real change lands here, and a rejected write snaps the
  // control back to what is actually stored.
  if (status !== syncedStatus) {
    setSyncedStatus(status);
    setValue(status);
  }

  useEffect(() => {
    if (state.error) {
      toast({ title: "Status not saved", description: state.error, tone: "error" });
    } else if (state.status) {
      toast({ title: `Marked as ${state.status}`, tone: "success" });
    }
  }, [state, toast]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);

    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const current = toStatus(value);

  function choose(next: OrderStatus) {
    setValue(next);
    setOpen(false);
    formRef.current?.requestSubmit();
  }

  function openMenu(index?: number) {
    const nextIndex = index ?? ORDER_STATUSES.indexOf(current);
    setActiveIndex(nextIndex);
    setOpen(true);
  }

  function onListKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const next = (activeIndex + 1) % ORDER_STATUSES.length;
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const next = (activeIndex - 1 + ORDER_STATUSES.length) % ORDER_STATUSES.length;
      setActiveIndex(next);
      optionRefs.current[next]?.focus();
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      optionRefs.current[0]?.focus();
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const last = ORDER_STATUSES.length - 1;
      setActiveIndex(last);
      optionRefs.current[last]?.focus();
    }
  }

  return (
    <form ref={formRef} action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="status" value={value} />

      <div ref={wrapRef} className="relative inline-block text-left">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={`Status: ${current}`}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              openMenu();
            }
          }}
          className={`inline-flex items-center gap-2 rounded-full border py-1.5 pr-2.5 pl-3 text-sm font-medium capitalize outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-zinc-900/20 focus-visible:ring-offset-1 ${tones[current].pill}`}
        >
          <span className={`size-2 shrink-0 rounded-full ${tones[current].dot}`} />
          <span>{current}</span>
          <Chevron open={open} />
        </button>

        {open && (
          <ul
            role="listbox"
            aria-label="Order status"
            aria-activedescendant={`status-option-${ORDER_STATUSES[activeIndex]}`}
            onKeyDown={onListKeyDown}
            className="absolute right-0 z-20 mt-1.5 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white p-1 shadow-lg shadow-zinc-900/10"
          >
            {ORDER_STATUSES.map((option, index) => (
              <li
                key={option}
                id={`status-option-${option}`}
                role="option"
                aria-selected={option === current}
                tabIndex={-1}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                onClick={() => choose(option)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    choose(option);
                  }
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm capitalize outline-none ${
                  index === activeIndex ? "bg-zinc-100" : ""
                } ${option === current ? "font-semibold" : ""}`}
              >
                <span className={`size-2 shrink-0 rounded-full ${tones[option].dot}`} />
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>

      <StatusFeedback state={state} />
    </form>
  );
}

function toStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : "pending";
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`size-3.5 shrink-0 opacity-60 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function StatusFeedback({ state }: { state: OrderStatusState }) {
  const { pending } = useFormStatus();

  if (pending) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-zinc-400">
        <Spinner />
        Saving
      </span>
    );
  }

  if (state.error) {
    return <span className="text-xs font-medium text-red-600">Not saved</span>;
  }

  return null;
}

function Spinner() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5 animate-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        opacity="0.25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}