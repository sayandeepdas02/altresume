import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/lib/auth';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AltResume | AI Career Copilot",
  description: "Optimize your resume with AI and bypass the ATS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className={`${inter.variable} ${firaCode.variable} min-h-screen flex flex-col bg-white text-gray-900 font-sans antialiased selection:bg-black selection:text-white`}>
        <AuthProvider>
          <div className="flex-1 flex flex-col">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}
