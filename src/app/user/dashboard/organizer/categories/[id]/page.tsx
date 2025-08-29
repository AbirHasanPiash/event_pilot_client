"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function OrganizerCategoryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchCategory = async () => {
    setLoading(true);
    const data = await safeApiFetch<Category>(`/api/categories/${id}/`);
    if (data) setCategory(data);
    else router.push("/user/dashboard/organizer/categories");
    setLoading(false);
  };

  useEffect(() => {
    fetchCategory();
  }, [id]);

  const handleUpdate = async (form: { id?: number | null; name: string; description: string }) => {
    if (!category) return;
    setSubmitting(true);

    const result = await safeApiFetch(`/api/categories/${category.id}/`, {
      method: "PUT",
      body: JSON.stringify({ name: form.name, description: form.description }),
    });

    if (result) {
      toast.success("Category updated successfully!");
      setShowEditModal(false);
      fetchCategory();
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!category) return;
    const result = await safeApiFetch(`/api/categories/${category.id}/`, { method: "DELETE" });
    if (result !== null) {
      toast.success("Category deleted successfully!");
      router.push("/user/dashboard/organizer/categories");
    }
  };

  if (loading || !category) return <p className="p-6 text-gray-500">Loading...</p>;

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
        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{category.description}</p>
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
      />
    </div>
  );
}
