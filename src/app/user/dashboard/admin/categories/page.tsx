"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import ConfirmModal from "@/components/ConfirmModal";
import CategoryModal from "@/components/CategoryModal";
import LoadingSpinner from "@/components/LoadingSpinner";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface Category {
  id: number;
  name: string;
  description: string;
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const safeApiFetch = useSafeApiFetch();

  const [categories, setCategories] = useState<Category[]>([]);
  const [count, setCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Load categories
  const loadCategories = useCallback(
    async (query = "") => {
      setLoading(true);
      const data = await safeApiFetch<PaginatedResponse<Category>>(
        `/api/categories/?search=${encodeURIComponent(query)}`
      );
      if (data) {
        setCategories(data.results);
        setCount(data.count);
      }
      setLoading(false);
    },
    [safeApiFetch]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    router.replace(`/user/dashboard/admin/categories?${params.toString()}`);
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      loadCategories(searchTerm);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchTerm, loadCategories]);

  // Handle Create / Update
  const handleFormSubmit = async (form: {
    id?: number | null;
    name: string;
    description: string;
  }) => {
    setSubmitting(true);

    const isEdit = !!form.id;
    const method = isEdit ? "PUT" : "POST";
    const endpoint = isEdit
      ? `/api/categories/${form.id}/`
      : "/api/categories/";

    const result = await safeApiFetch(endpoint, {
      method,
      body: JSON.stringify({
        name: form.name,
        description: form.description,
      }),
    });

    if (result) {
      toast.success(`Category ${isEdit ? "updated" : "created"} successfully!`);
      setShowFormModal(false);
      setEditingCategory(null);
      loadCategories();
    }
    if (!result) {
      toast.error("Failed to save category. Please try again.");
    }

    setSubmitting(false);
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (categoryToDelete === null) return;

    const result = await safeApiFetch(`/api/categories/${categoryToDelete}/`, {
      method: "DELETE",
    });

    if (result !== null) {
      toast.success("Category deleted successfully!");
      loadCategories();
    }

    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header + Create Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Event Categories</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowFormModal(true);
          }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          <Plus size={18} /> New Category
        </button>
      </div>

      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full max-w-sm px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Category List */}
      {loading ? (
        // <p className="text-gray-500">Loading...</p>
        <LoadingSpinner />
      ) : categories.length === 0 ? (
        <p className="text-gray-500">No categories found.</p>
      ) : (
        <div className="grid gap-4">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-lg bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10"
            >
              <div
                onClick={() =>
                  router.push(`/user/dashboard/admin/categories/${cat.id}`)
                }
                className="cursor-pointer"
              >
                <h3 className="text-lg font-medium hover:text-indigo-600">
                  {cat.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {cat.description}
                </p>
              </div>
              <div className="flex gap-2 mt-2 sm:mt-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingCategory(cat);
                    setShowFormModal(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-sm border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-white/10 rounded"
                >
                  <Pencil size={16} /> Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoryToDelete(cat.id);
                    setShowDeleteConfirm(true);
                  }}
                  className="flex items-center gap-1 px-3 py-1 text-sm border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-white/10 rounded"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CategoryModal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          setEditingCategory(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingCategory || undefined}
        loading={submitting}
      />

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Category?"
        description="Are you sure you want to delete this category? This action cannot be undone."
        onCancel={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
        onConfirm={confirmDelete}
        confirmText="Delete"
      />
    </div>
  );
}
