
import "./globals.css";

export const metadata = {
  title: "CASSIUS'S EA SUITE",
  description:
    "A professional educational trading simulator and strategy analysis platform by CASSIUS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
