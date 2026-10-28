import type { Metadata } from "next";
import StaffPortal from "@/components/staff/StaffPortal";

export const metadata: Metadata = {
  title: "Кабинет мастера — МУС",
  description: "Личный кабинет команды барбершопа МУС в Челябинске.",
  robots: { index: false, follow: false },
};

export default function StaffPage() {
  return <StaffPortal />;
}
