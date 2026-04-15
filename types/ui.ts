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
};

export type LoadingEntryMap = Record<string, boolean>;

export type StarApiResponse = {
  stars?: number;
  error?: string;
  alreadyStarred?: boolean;
};
