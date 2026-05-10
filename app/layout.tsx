import '../styles/globals.css';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export const metadata = {
  title: 'LifeOS',
  description: 'Personal productivity dashboard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-white">
        <aside className="w-64 border-r bg-white">
          <Sidebar />
        </aside>
        <div className="flex-1 min-h-screen flex flex-col">
          <Header />
          <main className="p-6 bg-gray-50 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
