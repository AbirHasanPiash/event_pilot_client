"use client";

import React, { useEffect, useState } from "react";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import Image from "next/image";
import { AdminEventForm } from "@/types/events";

type ModalState = {
  id?: number | null;
  title: string;
  description: string;
  category_id: number | null;
  tags: string[];
  image: File | null;
  start_time: string | null; // "YYYY-MM-DDTHH:mm" (datetime-local)
  end_time: string | null;
  venue: string;
  location_map_url: string;
  visibility: string;
  status: string;
  capacity: number | null;
  allow_waitlist: boolean;
};

type ExtendedInitialData = Partial<
  AdminEventForm & {
    image_url?: string;
    existingImage?: string;
    category_id?: number | null;
  }
>;

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AdminEventForm) => void;
  initialData?: ExtendedInitialData;
  loading?: boolean;
}

interface CategoryOption {
  id: number;
  name: string;
}

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = {},
  loading = false,
}: EventModalProps) {
  const safeApiFetch = useSafeApiFetch();

  const [form, setForm] = useState<ModalState>({
    id: null,
    title: "",
    description: "",
    category_id: null,
    tags: [],
    image: null,
    start_time: null,
    end_time: null,
    venue: "",
    location_map_url: "",
    visibility: "public",
    status: "draft",
    capacity: null,
    allow_waitlist: false,
  });

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null); // track created blob URL

  // Load categories when modal opens
  useEffect(() => {
    if (isOpen) {
      (async () => {
        const data = await safeApiFetch<{ results: CategoryOption[] }>(
          "/api/categories/"
        );
        if (data && Array.isArray(data.results)) {
          setCategories(data.results);
        } else {
          setCategories([]); // fallback in case results is missing
        }
      })();
    }
  }, [isOpen, safeApiFetch]);

  // Map initial data -> local form state when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) return;

    const categoryId =
      initialData?.category?.id ?? initialData?.category_id ?? null;

    setForm({
      id: initialData?.id ?? null,
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      category_id: categoryId,
      tags: initialData?.tags ?? [],
      image: null, // file input starts empty
      start_time: initialData?.start_time
        ? initialData.start_time.slice(0, 16)
        : null,
      end_time: initialData?.end_time
        ? initialData.end_time.slice(0, 16)
        : null,
      venue: initialData?.venue ?? "",
      location_map_url: initialData?.location_map_url ?? "",
      visibility: initialData?.visibility ?? "public",
      status: initialData?.status ?? "draft",
      capacity: initialData?.capacity ?? null,
      allow_waitlist: initialData?.allow_waitlist ?? false,
    });

    // pick preview from either image_url, existingImage, or admin object's image
    const existing =
      initialData?.image_url ??
      initialData?.existingImage ??
      (typeof initialData?.image === "string" ? initialData.image : null);

    setPreviewUrl(existing);

    // revoke any leftover objectUrl (safety)
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    setTagInput("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  // cleanup on unmount/close
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  const handleChange = <
    T extends HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  >(
    e: React.ChangeEvent<T>
  ) => {
    const { name, value, type } = e.target;
    const key = name as keyof ModalState;

    let parsed: ModalState[typeof key];

    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      parsed = e.target.checked as ModalState[typeof key];
    } else if (type === "number") {
      parsed = (value === "" ? null : Number(value)) as ModalState[typeof key];
    } else {
      parsed = value as ModalState[typeof key];
    }

    setForm((prev) => ({
      ...prev,
      [key]: parsed,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;

    // revoke previous object URL if we created one
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setObjectUrl(url);
    } else {
      // if user cleared selection, revert preview to existing image (if any)
      const existing =
        initialData?.image_url ??
        initialData?.existingImage ??
        (typeof initialData?.image === "string" ? initialData.image : null);

      setPreviewUrl(existing);
    }

    setForm((prev) => ({ ...prev, image: file }));
  };

  const handleTagAdd = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !form.tags.includes(trimmed)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
      setTagInput("");
    }
  };

  const handleTagRemove = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const handleRemoveImage = () => {
    // revoke blob if present
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }
    // clear file selection and revert preview to existing image (if editing)
    const existing =
      initialData?.image_url ??
      initialData?.existingImage ??
      (typeof initialData?.image === "string" ? initialData.image : null);

    setPreviewUrl(existing);
    setForm((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Build payload in the shape AdminEventsPage expects:
    const payload: AdminEventForm = {
      id: form.id ?? null,
      title: form.title,
      description: form.description,
      // prefer to send full category object with id (Admin page expects form.category?.id)
      category: form.category_id
        ? { id: form.category_id }
        : initialData?.category ?? null,

      tags: form.tags,
      image: form.image ?? null, // File or null
      // note: these are "YYYY-MM-DDTHH:mm" (no timezone). AdminEventsPage currently forwards raw strings;
      // if your backend requires ISO with Z, convert: new Date(form.start_time!).toISOString()
      start_time: form.start_time ?? null,
      end_time: form.end_time ?? null,
      venue: form.venue,
      location_map_url: form.location_map_url,
      visibility: form.visibility,
      status: form.status,
      capacity: form.capacity,
      allow_waitlist: form.allow_waitlist,
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 w-full max-w-2xl p-6 rounded-lg shadow-lg space-y-4 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-lg font-semibold">
          {form.id ? "Edit Event" : "Create New Event"}
        </h2>

        {/* Title */}
        <div>
          <label className="block mb-1 font-medium" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block mb-1 font-medium" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block mb-1 font-medium" htmlFor="category_id">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            value={form.category_id ?? ""}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                category_id: e.target.value ? Number(e.target.value) : null,
              }))
            }
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block mb-1 font-medium">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tag..."
              className="flex-1 px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
            <button
              type="button"
              onClick={handleTagAdd}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="bg-gray-200 dark:bg-gray-700 text-sm px-2 py-1 rounded flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Image Upload + Preview */}
        <div>
          <label className="block mb-1 font-medium">Event Image</label>

          {previewUrl && (
            <>
              {previewUrl.startsWith("blob:") ||
              previewUrl.startsWith("data:") ? (
                <div className="w-full h-48 mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              ) : (
                <div className="relative w-full h-48 mb-2">
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    fill
                    unoptimized
                    className="object-cover rounded"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-3 py-2 border rounded bg-gray-100 dark:bg-gray-800"
            >
              Remove
            </button>
          </div>
        </div>

        {/* Start / End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Start Time</label>
            <input
              type="datetime-local"
              name="start_time"
              value={form.start_time ?? ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">End Time</label>
            <input
              type="datetime-local"
              name="end_time"
              value={form.end_time ?? ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>

        {/* Venue */}
        <div>
          <label className="block mb-1 font-medium">Venue</label>
          <input
            name="venue"
            value={form.venue}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* Location Map URL */}
        <div>
          <label className="block mb-1 font-medium">Location Map URL</label>
          <input
            name="location_map_url"
            value={form.location_map_url}
            onChange={handleChange}
            placeholder="https://maps.app.goo.gl/..."
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* Visibility & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Visibility</label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Capacity & Waitlist */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Capacity</label>
            <input
              type="number"
              name="capacity"
              value={form.capacity ?? ""}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              name="allow_waitlist"
              checked={form.allow_waitlist}
              onChange={handleChange}
            />
            <label>Allow Waitlist</label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              handleRemoveImage();
              onClose();
            }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || form.title.trim() === ""}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {loading ? "Saving..." : form.id ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
