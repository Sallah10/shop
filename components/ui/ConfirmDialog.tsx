"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState } from "react";

type ConfirmDialogProps = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  trigger: React.ReactNode;
};

/**
 * Confirmation built on the native <dialog> element, so focus trapping,
 * Escape to close and the backdrop come from the platform instead of from a
 * dependency. onConfirm is expected to submit the surrounding form, which
 * keeps the server action as the single place the mutation happens.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  trigger,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }, [isOpen]);

  const triggerElement = isValidElement<{ onClick?: () => void }>(trigger)
    ? cloneElement(trigger, { onClick: () => setIsOpen(true) })
    : trigger;

  return (
    <>
      {triggerElement}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-zinc-200 bg-white p-0 text-zinc-900 backdrop:bg-zinc-900/40"
        onCancel={(event) => {
          event.preventDefault();
          setIsOpen(false);
        }}
        onClick={(event) => {
          // Only a click on the backdrop itself closes, not one inside the box.
          if (event.target === dialogRef.current) {
            setIsOpen(false);
          }
        }}
      >
        <div className="p-6">
          <h2 id={titleId} className="text-base font-semibold tracking-tight">
            {title}
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-zinc-600">
            {description}
          </p>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onConfirm();
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-500"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}