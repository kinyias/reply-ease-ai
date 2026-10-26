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
  title: "Đặt lịch hẹn tư vấn | Reply Ease AI Portal",
  description: "Cổng thông tin đặt lịch hẹn tư vấn trực tuyến và chọn khung giờ trống tiện lợi.",
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
