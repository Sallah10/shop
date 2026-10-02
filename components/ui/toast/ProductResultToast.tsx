"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useToast, type ToastTone } from "./ToastProvider";

const RESULT_KEYS = ["created", "saved", "deleted"] as const;

type ResultKey = (typeof RESULT_KEYS)[number];

const results: Record<ResultKey, { title: string; tone: ToastTone }> = {
  created: { title: "Product created", tone: "success" },
  saved: { title: "Product saved", tone: "success" },
  deleted: { title: "Product deleted", tone: "success" },
};

/**
 * A server action that succeeds redirects, which tears the page down before a
 * toast fired from the client could ever render. So the actions announce
 * themselves through the URL instead, and this component replays that on
 * arrival and then tidies the query string away.
 */
export function ProductResultToast() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) {
      return;
    }

    const key = RESULT_KEYS.find((candidate) => searchParams.get(candidate) === "1");

    if (!key) {
      return;
    }

    hasFired.current = true;
    toast(results[key]);

    const params = new URLSearchParams(searchParams.toString());

    for (const candidate of RESULT_KEYS) {
      params.delete(candidate);
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [hasFired, pathname, router, searchParams, toast]);

  return null;
}