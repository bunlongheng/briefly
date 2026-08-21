import type { Metadata } from "next";
import { getShareBook } from "@/lib/share-data";
import { mmss } from "@/lib/types";
import App from "@/app/page";

// Shareable per-book URL: /b/<id>. Crawlers read the per-book metadata + the
// colocated opengraph-image; humans get the full app, deep-linked straight into
// the reader (see the /b/<id> path handling in app/page.tsx).
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const b = await getShareBook(Number(id));
  if (!b) return { title: "Briefly" };

  const desc = [
    b.author ? `by ${b.author}` : null,
    b.duration_sec ? `${mmss(b.duration_sec)} listen` : null,
    "Read along, out loud - karaoke style.",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    title: `${b.title} · Briefly`,
    description: desc,
    openGraph: { title: b.title, description: desc, type: "article" },
    twitter: { card: "summary_large_image", title: b.title, description: desc },
  };
}

export default function BookSharePage() {
  return <App />;
}
