import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  ExternalLink,
  FileText,
  Mic,
  Presentation,
} from "lucide-react";
import { useState } from "react";
import { getCompanyDocuments } from "../data/documentsData";

interface Props {
  symbol: string;
}

export default function DocumentsSection({ symbol }: Props) {
  const docs = getCompanyDocuments(symbol);
  const [announcementFilter, setAnnouncementFilter] = useState<
    "recent" | "important" | "all"
  >("recent");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold" data-ocid="documents.section">
        Documents
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Announcements */}
        <div
          className="xl:col-span-1 bg-card border border-border rounded-lg flex flex-col"
          data-ocid="documents.panel"
        >
          <div className="px-4 pt-4 pb-2 border-b border-border">
            <h3 className="text-sm font-semibold mb-2">Announcements</h3>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setAnnouncementFilter("recent")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  announcementFilter === "recent"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="documents.announcements.tab"
              >
                Recent
              </button>
              <button
                type="button"
                onClick={() => setAnnouncementFilter("important")}
                className={`px-2 py-0.5 rounded transition-colors ${
                  announcementFilter === "important"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                data-ocid="documents.announcements.tab"
              >
                Important
              </button>
              <a
                href={docs.bseAnnouncementsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="documents.announcements.link"
              >
                All <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
          <ul className="flex-1 divide-y divide-border/50">
            {docs.announcements.map((ann, idx) => (
              <li
                key={ann.title}
                className="px-4 py-3"
                data-ocid={`documents.announcements.item.${idx + 1}`}
              >
                <a
                  href={ann.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs font-medium leading-snug block"
                >
                  {ann.title}
                </a>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug line-clamp-2">
                  {ann.summary}
                </p>
                <span className="text-xs text-muted-foreground/60 mt-0.5 block">
                  {ann.time} ago
                </span>
              </li>
            ))}
          </ul>
          <a
            href={docs.bseAnnouncementsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-muted-foreground hover:text-primary border-t border-border transition-colors"
            data-ocid="documents.announcements.button"
          >
            Show more <ChevronRight className="h-3 w-3" />
          </a>
        </div>

        {/* Annual Reports */}
        <div
          className="bg-card border border-border rounded-lg flex flex-col"
          data-ocid="documents.panel"
        >
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <h3 className="text-sm font-semibold">Annual Reports</h3>
          </div>
          <ul className="flex-1 divide-y divide-border/50">
            {docs.annualReports.map((ar, idx) => (
              <li
                key={ar.year}
                className="px-4 py-3"
                data-ocid={`documents.annual_reports.item.${idx + 1}`}
              >
                <a
                  href={ar.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs font-medium block"
                >
                  {ar.label}
                </a>
                <span className="text-xs text-muted-foreground">
                  from {ar.source}
                </span>
              </li>
            ))}
          </ul>
          <a
            href={docs.bseAnnualReportsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-muted-foreground hover:text-primary border-t border-border transition-colors"
            data-ocid="documents.annual_reports.button"
          >
            View all <ChevronRight className="h-3 w-3" />
          </a>
        </div>

        {/* Credit Ratings */}
        <div
          className="bg-card border border-border rounded-lg flex flex-col"
          data-ocid="documents.panel"
        >
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <h3 className="text-sm font-semibold">Credit Ratings</h3>
          </div>
          <ul className="flex-1 divide-y divide-border/50">
            {docs.creditRatings.map((cr, idx) => (
              <li
                key={`${cr.date}-${cr.agency}`}
                className="px-4 py-3"
                data-ocid={`documents.credit_ratings.item.${idx + 1}`}
              >
                <a
                  href={cr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-xs font-medium block"
                >
                  {cr.title}
                </a>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {cr.date}
                  </span>
                  <span className="text-xs text-muted-foreground/50">·</span>
                  <span className="text-xs text-muted-foreground">
                    from {cr.agency}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          <a
            href={`https://www.icra.in/Rating/GetRatingDetail?id=${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-muted-foreground hover:text-primary border-t border-border transition-colors"
            data-ocid="documents.credit_ratings.button"
          >
            View all <ChevronRight className="h-3 w-3" />
          </a>
        </div>

        {/* Concalls */}
        <div
          className="bg-card border border-border rounded-lg flex flex-col"
          data-ocid="documents.panel"
        >
          <div className="px-4 pt-4 pb-3 border-b border-border">
            <h3 className="text-sm font-semibold">Concalls</h3>
          </div>
          <ul className="flex-1 divide-y divide-border/50">
            {docs.concalls.map((cc, idx) => (
              <li
                key={cc.period}
                className="px-4 py-2.5 flex items-center justify-between gap-2"
                data-ocid={`documents.concalls.item.${idx + 1}`}
              >
                <span className="text-xs font-medium shrink-0">{cc.month}</span>
                <div className="flex items-center gap-1">
                  {cc.transcriptUrl && (
                    <a
                      href={cc.transcriptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="documents.concalls.button"
                    >
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-5 cursor-pointer hover:bg-secondary transition-colors gap-0.5"
                      >
                        <FileText className="h-2.5 w-2.5" />
                        Transcript
                      </Badge>
                    </a>
                  )}
                  {cc.pptUrl && (
                    <a
                      href={cc.pptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="documents.concalls.button"
                    >
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-5 cursor-pointer hover:bg-secondary transition-colors gap-0.5"
                      >
                        <Presentation className="h-2.5 w-2.5" />
                        PPT
                      </Badge>
                    </a>
                  )}
                  {cc.recUrl && (
                    <a
                      href={cc.recUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-ocid="documents.concalls.button"
                    >
                      <Badge
                        variant="outline"
                        className="text-xs px-1.5 py-0 h-5 cursor-pointer hover:bg-secondary transition-colors gap-0.5"
                      >
                        <Mic className="h-2.5 w-2.5" />
                        REC
                      </Badge>
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <a
            href={docs.irPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs text-muted-foreground hover:text-primary border-t border-border transition-colors"
            data-ocid="documents.concalls.link"
          >
            IR Page <ChevronRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
