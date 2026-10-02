"use client";

import { useState } from "react";

type QuantityInputProps = {
  value: number;
  onChange: (quantity: number) => void;
  max?: number;
  min?: number;
  label: string;
  className?: string;
};

export function QuantityInput({
  value,
  onChange,
  max = 99,
  min = 1,
  label,
  className,
}: QuantityInputProps) {
  const [isPendingValue, setIsPendingValue] = useState<number | null>(null);

  const shown = isPendingValue ?? value;

  return (
    <div
      className={`inline-flex items-center rounded-lg border border-zinc-300 bg-white ${className ?? ""}`}
    >
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={shown <= min}
        onClick={() => {
          setIsPendingValue(null);
          onChange(shown - 1);
        }}
        className="grid size-9 place-items-center text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
      >
        &minus;
      </button>

      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={shown}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          setIsPendingValue(Number.isNaN(next) ? min : Math.min(Math.max(next, min), max));
        }}
        onBlur={() => {
          if (isPendingValue !== null) {
            onChange(isPendingValue);
            setIsPendingValue(null);
          }
        }}
        className="w-10 border-0 bg-transparent text-center text-sm font-medium tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={shown >= max}
        onClick={() => {
          setIsPendingValue(null);
          onChange(shown + 1);
        }}
        className="grid size-9 place-items-center text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent"
      >
        +
      </button>
    </div>
  );
}
