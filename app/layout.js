import "./globals.css";
import { Prompt } from "next/font/google";
import { Geist_Mono } from "next/font/google";

const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "Booking Assist System",
  description: "QR Manager System",
  icons: {
    icon: [{ url: "/hanuman-logo.jpg", type: "image/jpeg" }],
    shortcut: "/hanuman-logo.jpg",
    apple: "/hanuman-logo.jpg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={`${prompt.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
