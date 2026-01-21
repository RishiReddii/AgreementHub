import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'AgreementHub - Document Management System',
  description: 'Streamline your document workflow with templates and lifecycle management',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
