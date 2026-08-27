"use client";

// Global error boundary (FE-001). Renders when the root layout itself fails,
// so it must ship its own html/body and cannot rely on the app's fonts or
// Tailwind tokens — hence the inline styles. Kept deliberately plain: if this
// screen is up, even theming is not guaranteed to be available.

import { useEffect } from "react";
import { reportError } from "@/lib/telemetry";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { scope: "global-boundary" });
  }, [error]);

  return (
    <html lang="bn">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "24px",
            gap: "12px",
          }}
        >
          <p style={{ fontSize: "1.05rem", fontWeight: 600 }}>কিছু একটা ঠিক হচ্ছে না</p>
          <p style={{ maxWidth: "24rem", fontSize: "0.875rem", lineHeight: 1.7 }}>
            অ্যাপ চালু করতে বড় ধরনের সমস্যা হয়েছে। আবার চেষ্টা করুন।
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              border: "none",
              background: "#0F5C4D",
              color: "#FFFFFF",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            আবার চেষ্টা করুন
          </button>
        </div>
      </body>
    </html>
  );
}
