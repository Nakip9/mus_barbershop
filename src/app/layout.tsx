import type { Metadata } from "next";
import "./globals.css";
import "./booking.css";
import "./staff.css";
import "./information.css";

export const metadata: Metadata = {
  title: "Барбершоп «МУС» в Челябинске — стрижки и онлайн-запись",
  description:
    "Барбершоп «МУС» в Челябинске — мужские стрижки от 700₽, оформление бороды, детские стрижки. Выбирайте мастера и свободное время для записи онлайн.",
  keywords: ["барбершоп Челябинск", "мужская стрижка", "МУС", "оформление бороды", "детская стрижка"],
  openGraph: {
    title: "Барбершоп «МУС» в Челябинске",
    description: "Мужские стрижки от 700₽. Челябинск. Выберите мастера и запишитесь онлайн.",
    siteName: "Барбершоп «МУС»",
    type: "website",
    locale: "ru_RU",
  },
  icons: { icon: "/assets/brand/mus-logo.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
