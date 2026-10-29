import { Suspense } from "react";
import { Metadata } from "next";
import { Loader2Icon } from "lucide-react";
import AppointmentClient from "./appointment-client";

interface AppointmentPortalPageProps {
  params: Promise<{
    domainid: string;
    customerid: string;
  }>;
}

export const metadata: Metadata = {
  title: "Book a Consultation Call | ReplyEase AI Portal",
  description: "Online consultation booking portal with convenient real-time available time slots.",
};

export default function AppointmentPortalPage({
  params,
}: AppointmentPortalPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <Loader2Icon className="size-8 text-orange-600 animate-spin" />
        </div>
      }
    >
      <AppointmentClient params={params} />
    </Suspense>
  );
}
