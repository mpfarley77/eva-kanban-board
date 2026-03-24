import type { ActivityEvent } from "./types";

type Props = {
  activity: ActivityEvent[];
  onClear: () => void;
};

export default function ActivityLog({ activity, onClear }: Props) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold">Recent Activity</h2>
        <button
          className="text-xs rounded border border-slate-700 px-2 py-1 hover:bg-slate-800"
          onClick={onClear}
        >
          Clear
        </button>
      </div>
      {activity.length === 0 ? (
        <p className="text-sm text-slate-500">No recent activity yet.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {activity.slice(0, 8).map((event, idx) => (
            <li
              key={`${event.at}-${idx}`}
              className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-950 px-3 py-2"
            >
              <span className="text-slate-200">{event.message}</span>
              <span className="shrink-0 text-xs text-slate-500">
                {new Date(event.at).toLocaleTimeString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
