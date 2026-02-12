import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "./context/CartContext"; // <--- Import the Brain

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BowlIt - Office Lunches",
  description: "Batched delivery for Newtown tech parks",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}