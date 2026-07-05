import { STAGE_LABELS, type ProjectStage } from "@/types/database";

const STAGE_STYLES: Record<ProjectStage, string> = {
  deposit: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  dno: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  installation: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  handover: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  complete: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
};

export function StageBadge({ stage }: { stage: ProjectStage }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_STYLES[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}
