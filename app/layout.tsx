import '../styles/globals.css';
import Shell from '../components/Shell';
import { ThemeProvider } from '../components/ThemeProvider';

export const metadata = {
  title: 'LifeOS',
  description: 'Personal productivity dashboard'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex bg-white dark:bg-gray-900">
        <ThemeProvider>
          <Shell>{children}</Shell>
        </ThemeProvider>
      </body>
    </html>
  );
}
