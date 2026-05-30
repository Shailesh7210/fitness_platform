import { Sidebar } from './Sidebar';
import { Header }  from './Header';

interface UserLayoutProps {
  title:    string;
  children: React.ReactNode;
}

export function UserLayout({ title, children }: UserLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isAdmin={false} />
      <div className="flex-1 ml-64">
        <Header title={title} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}