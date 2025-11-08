import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Selection App",
  description: "Secure image selection and download management",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
