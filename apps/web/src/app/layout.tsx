import './global.css';
import Providers from './providers';

export const metadata = {
  title: 'Feature Flags Manager',
  description: 'Manage your feature flags with ease.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
