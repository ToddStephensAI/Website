"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/types/database";

type Participant = { name: string; role: string };

export function ChatThread({
  projectId,
  currentUserId,
  participants,
  initialMessages,
}: {
  projectId: string;
  currentUserId: string;
  participants: Record<string, Participant>;
  initialMessages: Message[];
}) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`messages-${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, supabase]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ project_id: projectId, sender_id: currentUserId, body: trimmed })
      .select()
      .single();

    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as Message]));
      setBody("");
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col rounded-lg border border-neutral-200 dark:border-neutral-800">
      <div className="flex max-h-80 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-400">No messages yet.</p>
        )}
        {messages.map((m) => {
          const isMe = m.sender_id === currentUserId;
          const who = participants[m.sender_id]?.name ?? "Office";
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="mb-0.5 text-xs text-neutral-400">{isMe ? "You" : who}</span>
              <p
                className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                  isMe
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                {m.body}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write a message…"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          Send
        </button>
      </form>
    </div>
  );
}
