"use client";

export function DocumentPrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="admin-secondary-button">
      Print / Save PDF
    </button>
  );
}
