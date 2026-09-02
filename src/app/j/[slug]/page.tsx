import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fetchBizonRoomInfo } from "@/lib/bizon-room";
import { EntryFormClient } from "@/components/entry-form-client";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const form = await prisma.entryForm.findUnique({ where: { slug, isActive: true } });
  if (!form) return { title: "Страница не найдена" };
  return { title: form.title ?? "Вход на вебинар" };
}

export default async function EntryFormPage({ params }: Props) {
  const { slug } = await params;

  const form = await prisma.entryForm.findUnique({ where: { slug, isActive: true } });
  if (!form) notFound();

  await prisma.entryForm.update({ where: { id: form.id }, data: { clicks: { increment: 1 } } });

  const info = await fetchBizonRoomInfo(form.bizonRoomUrl);

  return (
    <EntryFormClient
      bizonRoomUrl={form.bizonRoomUrl}
      title={form.title ?? info.title ?? "Вход на вебинар"}
      speaker={info.speaker}
      dateLabel={info.dateLabel}
    />
  );
}
