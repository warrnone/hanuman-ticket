import "./globals.css";

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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}