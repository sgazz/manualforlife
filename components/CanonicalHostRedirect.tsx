"use client";

import { useEffect } from "react";
import { CANONICAL_APP_ORIGIN } from "@/lib/site";

/**
 * Production-only guard: iOS share UI shows the document host, not only navigator.share url.
 * Redirect *.vercel.app visitors to the canonical app host before they copy or share.
 */
export function CanonicalHostRedirect() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    const { hostname, pathname, search, hash } = window.location;
    if (!hostname.endsWith(".vercel.app")) {
      return;
    }

    const destination = `${CANONICAL_APP_ORIGIN}${pathname}${search}${hash}`;
    if (window.location.href !== destination) {
      window.location.replace(destination);
    }
  }, []);

  return null;
}
