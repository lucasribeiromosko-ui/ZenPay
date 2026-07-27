import { Suspense } from "react";
import Checkout from "@/components/checkout/Checkout";

export const metadata = {
  title: "Pagamento seguro — ZenPay",
};

export default function PayPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zen-bg" />}>
      <Checkout linkId={params.id} />
    </Suspense>
  );
}
