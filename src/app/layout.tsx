import "../styles/globals.css";

import type { Metadata } from "next";
import { Nunito } from "next/font/google";

import { cn } from "@/lib/utils";
import Providers from "@/components/Provider";
import Navbar from "@/components/navbar/Navbar";
import { ThemeProvider } from "@/components/theme-provider";
import Footer from "@/components/common/Footer";
import { siteConfig } from "@/config/site";

const inter = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "nextjs",
    "react",
    "react server components",
    "supabase",
    "poll",
    "vote",
  ],
  authors: [
    {
      name: "anmol",
      url: "https://github.com/AnmolSaini16",
    },
  ],
  creator: "anmol",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("bg-background antialiased", inter.className)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <main className="max-w-7xl mx-auto min-h-screen space-y-10 px-4">
              <Navbar />

              <div className="flex-1 w-full h-full min-h-[calc(100vh-240px)]">
                {children}
              </div>

              <Footer />
            </main>
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
