"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Photo } from "@/types/database";

export function PhotoGallery({
  projectId,
  uploaderId,
  canUpload,
  initialPhotos,
}: {
  projectId: string;
  uploaderId: string;
  canUpload: boolean;
  initialPhotos: Photo[];
}) {
  const supabase = createClient();
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUrls() {
      if (photos.length === 0) return;
      const paths = photos.map((p) => p.storage_path);
      const { data } = await supabase.storage
        .from("project-photos")
        .createSignedUrls(paths, 3600);
      if (!data) return;
      const map: Record<string, string> = {};
      data.forEach((entry) => {
        if (entry.signedUrl) map[entry.path ?? ""] = entry.signedUrl;
      });
      setUrls(map);
    }
    loadUrls();
  }, [photos, supabase]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const path = `${projectId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("project-photos")
      .upload(path, file);

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("photos")
      .insert({ project_id: projectId, uploaded_by: uploaderId, storage_path: path })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setPhotos((prev) => [...prev, data as Photo]);
    }
    setUploading(false);
    e.target.value = "";
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium">Installation photos</h3>
        {canUpload && (
          <label className="cursor-pointer rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-neutral-900">
            {uploading ? "Uploading…" : "Upload photo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />
          </label>
        )}
      </div>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      {photos.length === 0 ? (
        <p className="text-sm text-neutral-400">No photos uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p) => (
            <a
              key={p.id}
              href={urls[p.storage_path]}
              target="_blank"
              rel="noopener noreferrer"
              className="block aspect-square overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-800"
            >
              {urls[p.storage_path] && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={urls[p.storage_path]}
                  alt={p.caption ?? "Installation photo"}
                  className="h-full w-full object-cover"
                />
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
