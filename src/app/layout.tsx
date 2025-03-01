import "../styles/globals.css";

import {Nunito} from "next/font/google";

import Footer from "@/components/common/Footer";
import Navbar from "@/components/navbar/Navbar";
import {ThemeProvider} from "@/components/theme-provider";
import {Toaster} from "@/components/ui/toaster";
import {cn} from "@/lib/utils";

import {Providers} from "./providers";

const inter = Nunito({subsets: ["latin"]});

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
            <Toaster />
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
