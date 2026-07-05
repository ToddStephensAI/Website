"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Task } from "@/types/database";

export function TaskList({
  initialTasks,
  projectId,
}: {
  initialTasks: Task[];
  projectId?: string;
}) {
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [title, setTitle] = useState("");

  async function toggle(task: Task) {
    const newStatus = task.status === "open" ? "done" : "open";
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: trimmed, project_id: projectId ?? null })
      .select()
      .single();
    if (!error && data) {
      setTasks((prev) => [data as Task, ...prev]);
      setTitle("");
    }
  }

  const open = tasks.filter((t) => t.status === "open");
  const done = tasks.filter((t) => t.status === "done");

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-3 font-medium">To-do</h3>
      <form onSubmit={addTask} className="mb-3 flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-neutral-900"
        >
          Add
        </button>
      </form>
      <ul className="flex flex-col gap-1.5">
        {open.map((t) => (
          <li key={t.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={false} onChange={() => toggle(t)} />
            <span>{t.title}</span>
          </li>
        ))}
        {open.length === 0 && <p className="text-sm text-neutral-400">Nothing outstanding.</p>}
      </ul>
      {done.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs text-neutral-400">
            {done.length} completed
          </summary>
          <ul className="mt-2 flex flex-col gap-1.5">
            {done.map((t) => (
              <li key={t.id} className="flex items-center gap-2 text-sm text-neutral-400 line-through">
                <input type="checkbox" checked={true} onChange={() => toggle(t)} />
                <span>{t.title}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
