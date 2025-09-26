"use client";

import { useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { toast } from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import ConfirmModal from "@/components/ConfirmModal";
import CategoryModal from "@/components/CategoryModal";

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function CategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // SWR fetcher
  const fetcher = useCallback(
    (url: string) => safeApiFetch<Category>(url),
    [safeApiFetch]
  );

  // SWR hook
  const { data: category, error, isLoading, mutate } = useSWR(
    id ? `/api/categories/${id}/` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  // Handle update
  const handleUpdate = async (form: {
    id?: number | null;
    name: string;
    description: string;
  }) => {
    if (!category) return;
    setSubmitting(true);

    try {
      const result = await safeApiFetch(`/api/categories/${category.id}/`, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name,
          description: form.description,
        }),
      });

      if (result) {
        toast.success("Category updated successfully!");
        setShowEditModal(false);
        mutate(); // refresh category
      } else {
        toast.error("Failed to update category.");
      }
    } catch {
      toast.error("An error occurred while updating.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!category) return;
    setDeleteLoading(true);

    try {
      const result = await safeApiFetch(`/api/categories/${category.id}/`, {
        method: "DELETE",
      });

      if (result !== null) {
        toast.success("Category deleted successfully!");
        router.push("/user/dashboard/admin/categories");
      } else {
        toast.error("Failed to delete category.");
      }
    } catch {
      toast.error("An error occurred while deleting.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (isLoading) return <p className="p-6 text-gray-500">Loading...</p>;
  if (error || !category) {
    toast.error("Failed to fetch category.");
    router.push("/user/dashboard/admin/categories");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">{category.name}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded"
          >
            <Pencil size={16} /> Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-white/10 rounded"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-indigo-500 p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium mb-2">Description</h2>
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
          {category.description}
        </p>
      </div>

      {/* Edit Modal */}
      <CategoryModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleUpdate}
        initialData={category}
        loading={submitting}
      />

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        confirmText="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}
