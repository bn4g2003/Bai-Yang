"use client";

import { DesktopQrScanButton } from "@/components/qr/DesktopQrScanButton";

export function NhatKyToolbar() {
  return (
    <div className="flex shrink-0 justify-end">
      <DesktopQrScanButton />
    </div>
  );
}
