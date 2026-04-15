type Entry = {
  id: string;
  text: string;
};

type EntriesListProps = {
  entries: Entry[];
  isLoading: boolean;
};

export function EntriesList({ entries, isLoading }: EntriesListProps) {
  return (
    <section
      className="w-full rounded-2xl border bg-[color:var(--theme-surface)] p-5 shadow-sm backdrop-blur-sm transition-colors duration-400 sm:p-6"
      style={{ borderColor: "var(--theme-border)" }}
    >
      <h2 className="mb-4 text-sm font-medium tracking-wide text-[color:var(--theme-muted)] uppercase transition-colors duration-[400ms]">
        Latest traces
      </h2>

      {isLoading ? (
        <p className="py-4 text-sm text-[color:var(--theme-muted)]">
          Loading entries...
        </p>
      ) : entries.length === 0 ? (
        <p className="py-4 text-sm text-[color:var(--theme-muted)]">
          No entries yet. Leave the first trace.
        </p>
      ) : (
        <ul className="divide-y" style={{ borderColor: "var(--theme-border)" }}>
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="py-4 text-base leading-relaxed text-[color:var(--theme-text)] transition-colors duration-[400ms]"
            >
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
