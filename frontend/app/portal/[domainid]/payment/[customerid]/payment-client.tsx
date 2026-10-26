"use client";

import { use } from "react";
import { CheckoutWizard } from "@/components/portal/checkout-wizard";

export default function PaymentClient({
  params,
}: {
  params: Promise<{ domainid: string; customerid: string }>;
}) {
  const { domainid, customerid } = use(params);

  return <CheckoutWizard domainId={domainid} customerId={customerid} />;
}
