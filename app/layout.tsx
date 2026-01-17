import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({children,}: {children: React.ReactNode;}) 
{
  return (
    <html lang="fr">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}