import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Don Suites & Vacation Apartments",
  description: "Hotel Management System",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
