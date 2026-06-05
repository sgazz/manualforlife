import type { Metadata } from "next";
import { TraceNotFound } from "@/components/trace/TraceNotFound";
import { TracePageCard } from "@/components/trace/TracePageCard";
import {
  buildTraceMetaDescription,
  fetchPublicEntryById,
  isValidEntryId,
} from "@/lib/entries";
import { buildTracePath, siteUrl } from "@/lib/site";

const TRACE_TITLE = "A Trace left on manualfor.life";
const NOT_FOUND_TITLE = "Trace not found — manualfor.life";

type TracePageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: TracePageProps): Promise<Metadata> {
  const { id } = await params;
  const canonicalPath = buildTracePath(id);

  if (!isValidEntryId(id)) {
    return {
      title: NOT_FOUND_TITLE,
      description: "This trace could not be found.",
      alternates: { canonical: canonicalPath },
      robots: { index: false, follow: false },
    };
  }

  const entry = await fetchPublicEntryById(id);
  if (!entry) {
    return {
      title: NOT_FOUND_TITLE,
      description: "This trace could not be found.",
      alternates: { canonical: canonicalPath },
      robots: { index: false, follow: false },
    };
  }

  const description = buildTraceMetaDescription(entry.text);
  const url = `${siteUrl}${canonicalPath}`;

  return {
    title: TRACE_TITLE,
    description,
    alternates: { canonical: canonicalPath },
    openGraph: {
      type: "article",
      url,
      title: TRACE_TITLE,
      description,
      siteName: "Manualfor.life",
    },
    twitter: {
      card: "summary",
      title: TRACE_TITLE,
      description,
    },
  };
}

export default async function TracePage({ params }: TracePageProps) {
  const { id } = await params;

  if (!isValidEntryId(id)) {
    return <TraceNotFound />;
  }

  const entry = await fetchPublicEntryById(id);
  if (!entry) {
    return <TraceNotFound />;
  }

  return <TracePageCard entry={entry} />;
}
