export type Entry = {
  id: string;
  text: string;
  created_at: string;
  stars: number;
  signature: string | null;
};

export type PanelType = "live" | "starred" | null;

export type StarActionOptions = {
  closePanelOnSuccess?: boolean;
  /** When starring from a list row, pass the entry so local saved-traces can persist metadata. */
  sourceEntry?: Entry;
};

export type LoadingEntryMap = Record<string, boolean>;

export type StarApiResponse = {
  stars?: number;
  error?: string;
  alreadyStarred?: boolean;
};
