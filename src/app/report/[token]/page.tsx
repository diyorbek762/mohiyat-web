import type { Metadata } from "next";
import { SharedReportView } from "./SharedReportView";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  return {
    title: `Mohiyat AI — Shartnoma hisoboti`,
    description: `Shartnoma tahlili natijasi. Hisobot ID: ${token}`,
    openGraph: {
      title: "Mohiyat AI — Shartnoma hisoboti",
      description: "Sun'iy intellekt yordamida tahlil qilingan shartnoma hisoboti",
    },
  };
}

export default async function SharedReportPage({ params }: PageProps) {
  const { token } = await params;
  return <SharedReportView token={token} />;
}
