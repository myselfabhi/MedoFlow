'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPatientFiles,
  deletePatientFile,
  downloadPatientFile,
  type PatientFile,
} from '@/lib/fileApi';

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const PREVIEW_MIMES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];

function FilePreview({
  file,
  clinicId,
}: {
  file: PatientFile;
  clinicId?: string;
}) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const canPreview = PREVIEW_MIMES.some(
    (m) =>
      file.mimeType.toLowerCase() === m ||
      file.mimeType.toLowerCase().startsWith(m.split('/')[0] + '/')
  );

  const openPreview = async () => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const params = clinicId ? `?clinicId=${clinicId}` : '';
    const url = `${base}/api/v1/files/${file.id}/download${params}`;
    const token = typeof window !== 'undefined' ? (await import('@/lib/api')).getAccessToken() : null;
    const res = await fetch(url, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    setPreviewUrl(URL.createObjectURL(blob));
    setPreviewOpen(true);
  };

  const closePreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPreviewOpen(false);
  };

  if (!canPreview) return null;

  const isImage = file.mimeType.toLowerCase().startsWith('image/');
  const isPdf = file.mimeType.toLowerCase().includes('pdf');

  return (
    <>
      <button
        type="button"
        onClick={openPreview}
        className="text-xs text-primary-600 hover:text-primary-700"
      >
        Preview
      </button>
      {previewOpen && previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={closePreview}
        >
          <div
            className="max-h-[90vh] max-w-[90vw] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {isImage && (
              <img
                src={previewUrl}
                alt={file.originalName}
                className="max-h-[90vh] object-contain"
              />
            )}
            {isPdf && (
              <iframe
                src={previewUrl}
                title={file.originalName}
                className="h-[90vh] w-[90vw]"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export function PatientFilesSection({
  patientId,
  clinicId,
  canDelete = false,
}: {
  patientId: string;
  clinicId?: string;
  canDelete?: boolean;
}) {
  const queryClient = useQueryClient();
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', 'patient', patientId, clinicId],
    queryFn: () => getPatientFiles(patientId, clinicId),
    enabled: !!patientId,
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => deletePatientFile(fileId, clinicId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files', 'patient', patientId] });
    },
  });

  const allTags = Array.from(
    new Set(
      files.flatMap((f) => (Array.isArray(f.tags) ? f.tags : f.tags ? [String(f.tags)] : []))
    )
  ).filter(Boolean) as string[];

  const filteredFiles = tagFilter
    ? files.filter((f) =>
        Array.isArray(f.tags) ? f.tags.includes(tagFilter) : false
      )
    : files;

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Files</h2>
        <div className="mt-4 h-24 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">Files</h2>
      {allTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              !tagFilter
                ? 'bg-primary-100 text-primary-800'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                tagFilter === tag
                  ? 'bg-primary-100 text-primary-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
      {filteredFiles.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">No files</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {filteredFiles.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {file.originalName}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatSize(file.size)} • {formatDate(file.createdAt)} •{' '}
                  {file.uploadedBy.name}
                </p>
                {Array.isArray(file.tags) && file.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {file.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-2">
                <FilePreview file={file} clinicId={clinicId} />
                <button
                  type="button"
                  onClick={() => downloadPatientFile(file.id, file.originalName, clinicId)}
                  className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Download
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(file.id)}
                    disabled={deleteMutation.isPending}
                    className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 hover:border-red-300"
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
