"use client";

import Image from "next/image";
import { useState } from "react";

type ProductImageProps = {
  src: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function ProductImage({ src, alt, sizes, className, priority }: ProductImageProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!src || hasFailed) {
    return (
      <div
        className={`grid h-full w-full place-items-center bg-zinc-100 text-3xl font-semibold text-zinc-400 ${className ?? ""}`}
      >
        {alt.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setHasFailed(true)}
      className={`object-cover ${className ?? ""}`}
    />
  );
}
