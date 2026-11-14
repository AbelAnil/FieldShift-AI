import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";

export const metadata: Metadata = {
  title: "FieldShift AI - NASA Agricultural Decision-Support",
  description:
    "Predictive agricultural decision-support platform combining NASA Earth observations, soil intelligence, terrain analysis, and crop rotation optimization for Kerala, India.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-zinc-950 text-zinc-100 antialiased font-sans" suppressHydrationWarning>
        <AuthProvider>
          <UIProvider>
            <div className="flex min-h-screen relative w-full overflow-x-hidden">
              <Sidebar />
              <div className="flex-1 flex flex-col min-w-0 w-full">
                <OfflineBanner />
                <Header />
                <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-20 md:pb-8 overflow-y-auto w-full max-w-full">{children}</main>
              </div>
              <MobileBottomNav />
            </div>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
