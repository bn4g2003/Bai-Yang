"use client";

import { DesktopQrScanButton } from "@/components/qr/DesktopQrScanButton";

export function NhatKyToolbar() {
  return (
    <div className="mb-4 flex justify-end">
      <DesktopQrScanButton />
    </div>
  );
}
