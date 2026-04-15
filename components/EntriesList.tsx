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
    <section className="w-full rounded-2xl border border-slate-200/70 bg-white/70 p-5 shadow-sm backdrop-blur-sm sm:p-6">
      <h2 className="mb-4 text-sm font-medium tracking-wide text-slate-500 uppercase">
        Latest traces
      </h2>

      {isLoading ? (
        <p className="py-4 text-sm text-slate-500">Loading entries...</p>
      ) : entries.length === 0 ? (
        <p className="py-4 text-sm text-slate-500">
          No entries yet. Leave the first trace.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200/80">
          {entries.map((entry) => (
            <li key={entry.id} className="py-4 text-base leading-relaxed text-slate-800">
              {entry.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
