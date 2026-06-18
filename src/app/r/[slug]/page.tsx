import { notFound } from "next/navigation";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

const getLink = cache(async (slug: string) => {
  return prisma.linkRedirect.findUnique({
    where: { slug, isActive: true },
  });
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const link = await getLink(slug);
  if (!link) return { title: "Страница не найдена" };

  return {
    title: link.ogTitle ?? "Переход...",
    description: link.ogDescription ?? undefined,
    openGraph: {
      title: link.ogTitle ?? undefined,
      description: link.ogDescription ?? undefined,
      images: link.ogImageUrl
        ? [{ url: link.ogImageUrl, width: 1200, height: 630 }]
        : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: link.ogTitle ?? undefined,
      description: link.ogDescription ?? undefined,
      images: link.ogImageUrl ? [link.ogImageUrl] : undefined,
    },
  };
}

export default async function RedirectPage({ params }: Props) {
  const { slug } = await params;
  const link = await getLink(slug);
  if (!link) notFound();

  await prisma.linkRedirect.update({
    where: { id: link.id },
    data: { clicks: { increment: 1 } },
  });

  const dest = link.destinationUrl;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#030712",
        fontFamily: "sans-serif",
        color: "#9ca3af",
      }}
    >
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(dest)});`,
        }}
      />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid #7c3aed",
            borderTopColor: "transparent",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }}
        />
        <p style={{ margin: "0 0 8px", fontSize: 16 }}>Перенаправление...</p>
        <a href={dest} style={{ color: "#7c3aed", fontSize: 14 }}>
          нажмите здесь если не переходит
        </a>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
