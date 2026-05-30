import { Sidebar } from './Sidebar';
import { Header }  from './Header';

interface AdminLayoutProps {
  title:    string;
  children: React.ReactNode;
}

export function AdminLayout({ title, children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isAdmin={true} />
      <div className="flex-1 ml-64">
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}