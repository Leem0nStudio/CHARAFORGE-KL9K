import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { SiteHeader } from "@/components/site-header";

interface AdminLayoutProps {
    children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    return (
        <div className="flex min-h-screen w-full">
            <AdminSidebar />
            <main className="flex-1">
                {children}
            </main>
        </div>
    );
}
