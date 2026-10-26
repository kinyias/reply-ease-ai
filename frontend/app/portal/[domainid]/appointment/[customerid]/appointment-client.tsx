"use client";

import { use } from "react";
import { AppointmentWizard } from "@/components/portal/appointment-wizard";

export default function AppointmentClient({
  params,
}: {
  params: Promise<{ domainid: string; customerid: string }>;
}) {
  const { domainid, customerid } = use(params);

  return <AppointmentWizard domainId={domainid} customerId={customerid} />;
}
