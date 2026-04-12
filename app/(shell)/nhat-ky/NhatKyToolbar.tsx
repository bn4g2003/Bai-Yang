"use client";

import { DesktopQrScanButton } from "@/components/qr/DesktopQrScanButton";

export function NhatKyToolbar() {
  return (
    <div className="mb-4 hidden justify-end md:flex">
      <DesktopQrScanButton />
    </div>
  );
}
