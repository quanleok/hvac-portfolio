import type { Metadata } from "next";
import { PromoPage } from "./promo-page";

export const metadata: Metadata = {
  title: "Today's Deal · $49 Diagnostic | Double Le HVAC OKC",
  description:
    "Call today and get a $49 on-site diagnostic. Real quote before any work starts. Oklahoma City, Edmond, Moore, Norman, and more. (405) 361-5014.",
  robots: { index: false },
};

export default function Page() {
  return <PromoPage />;
}
