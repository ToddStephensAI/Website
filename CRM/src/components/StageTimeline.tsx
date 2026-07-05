import { STAGE_LABELS, STAGE_ORDER, type ProjectStage } from "@/types/database";

export function StageTimeline({ current }: { current: ProjectStage }) {
  const currentIndex = STAGE_ORDER.indexOf(current);

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-center">
      {STAGE_ORDER.map((stage, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={stage} className="flex flex-1 items-center gap-2 sm:flex-col sm:text-center">
            <div className="flex items-center gap-2 sm:flex-col">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  isDone
                    ? "bg-green-600 text-white"
                    : isCurrent
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-200 text-neutral-500 dark:bg-neutral-800"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </span>
              <span className={`text-sm ${isCurrent ? "font-semibold" : "text-neutral-500"}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <div className="hidden h-px flex-1 bg-neutral-200 sm:block dark:bg-neutral-800" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
