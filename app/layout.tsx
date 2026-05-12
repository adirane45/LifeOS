import '../styles/globals.css';
import Shell from '../components/Shell';
import { ThemeProvider } from '../components/ThemeProvider';
import { Toaster } from 'react-hot-toast';
import { getOnboardingStatus } from '../lib/settingsActions';

export const metadata = {
  title: 'LifeOS',
  description: 'Personal productivity dashboard'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const onboardingCompleted = await getOnboardingStatus();

  return (
    <html lang="en">
      <body className="min-h-screen flex bg-white dark:bg-gray-900">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-0 focus:left-0 focus:z-50 focus:p-2 focus:bg-primary focus:text-white focus:rounded">Skip to main content</a>
        <ThemeProvider>
          <Shell onboardingCompleted={onboardingCompleted}>{children}</Shell>
          <Toaster 
            position="bottom-right"
            reverseOrder={false}
            toastOptions={{
              success: {
                duration: 3000,
                style: {
                  background: '#10b981',
                  color: '#fff',
                  borderRadius: '0.5rem'
                }
              },
              error: {
                duration: 4000,
                style: {
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: '0.5rem'
                }
              }
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
