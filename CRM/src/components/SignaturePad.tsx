"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Signoff } from "@/types/database";

export function SignaturePad({
  projectId,
  existingSignoff,
}: {
  projectId: string;
  existingSignoff: Signoff | null;
}) {
  const supabase = createClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signoff, setSignoff] = useState<Signoff | null>(existingSignoff);
  const [hasDrawn, setHasDrawn] = useState(false);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = canvasRef.current?.getContext("2d");
    const { x, y } = getPos(e);
    ctx?.beginPath();
    ctx?.moveTo(x, y);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const { x, y } = getPos(e);
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#171717";
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  }

  function endDraw() {
    drawing.current = false;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  async function handleSave() {
    if (!name.trim() || !hasDrawn || !canvasRef.current) return;
    setSaving(true);
    setError(null);

    const dataUrl = canvasRef.current.toDataURL("image/png");
    const { data, error } = await supabase
      .from("signoffs")
      .insert({ project_id: projectId, signed_by_name: name.trim(), signature_data_url: dataUrl })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else if (data) {
      setSignoff(data as Signoff);
    }
    setSaving(false);
  }

  if (signoff) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          Signed off by {signoff.signed_by_name} on{" "}
          {new Date(signoff.signed_at).toLocaleDateString()}
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signoff.signature_data_url}
          alt="Customer signature"
          className="mt-2 h-20 rounded bg-white"
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <h3 className="mb-3 font-medium">Customer sign-off</h3>
      <input
        placeholder="Customer full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-3 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900"
      />
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
        className="mb-3 w-full touch-none rounded-md border border-dashed border-neutral-300 bg-white dark:border-neutral-700"
      />
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={clear}
          type="button"
          className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs dark:border-neutral-700"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !name.trim() || !hasDrawn}
          className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {saving ? "Saving…" : "Confirm sign-off"}
        </button>
      </div>
    </div>
  );
}
