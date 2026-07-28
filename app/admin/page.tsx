import AdminApp from "@/components/admin/AdminApp";

export const metadata = {
  title: "ZenPay Admin",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminApp />;
}
