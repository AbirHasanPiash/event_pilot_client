"use client";

import React, { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id?: number | null;
    name: string;
    description: string;
  }) => void;
  initialData?: { id?: number | null; name: string; description: string };
  loading?: boolean;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData = { id: null, name: "", description: "" },
  loading = false,
}: Props) {
  const [form, setForm] = useState(initialData);

  useEffect(() => {
    if (isOpen) {
      setForm({
        id: initialData?.id ?? null,
        name: initialData?.name ?? "",
        description: initialData?.description ?? "",
      });
    }
  }, [isOpen, initialData?.id, initialData?.name, initialData?.description]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-900 w-full max-w-md p-6 rounded-lg shadow-lg space-y-4"
      >
        <h2 className="text-lg font-semibold">
          {form.id ? "Edit Category" : "Create New Category"}
        </h2>
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || form.name.trim() === ""}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {loading ? "Saving..." : form.id ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
