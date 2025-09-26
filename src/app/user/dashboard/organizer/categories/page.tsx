"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR from "swr";
import { Pencil, Plus, Trash2, Search } from "lucide-react";
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

export default function OrganizerCategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeApiFetch = useSafeApiFetch();

  // URL state
  const initialSearch = searchParams.get("search") || "";
  const initialPage = Number(searchParams.get("page") || 1);

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  // debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 450);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Build query string
  const buildQuery = useCallback(
    (pageNum = page, search = debouncedSearch) => {
      const params = new URLSearchParams();
      params.set("page", String(pageNum));
      if (search) params.set("search", search);
      return params.toString();
    },
    [page, debouncedSearch]
  );

  // SWR key
  const swrKey = useMemo(
    () => `/api/categories/?${buildQuery(page)}`,
    [page, buildQuery]
  );

  // SWR fetcher
  const fetcher = useCallback(
    (url: string) => safeApiFetch<PaginatedResponse<Category>>(url),
    [safeApiFetch]
  );

  const { data, error, isLoading, mutate } = useSWR<
    PaginatedResponse<Category> | null
  >(swrKey, fetcher);

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }, [error]);

  // --- CRUD state ---
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null);

  // --- CRUD handlers ---
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
      mutate(); // refresh SWR cache
    } else {
      toast.error("Failed to save category. Please try again.");
    }
    setSubmitting(false);
  };

  const confirmDelete = async () => {
    if (categoryToDelete === null) return;

    const result = await safeApiFetch(`/api/categories/${categoryToDelete}/`, {
      method: "DELETE",
    });

    if (result !== null) {
      toast.success("Category deleted successfully!");
      mutate();
    }
    setShowDeleteConfirm(false);
    setCategoryToDelete(null);
  };

  // Pagination helpers
  const goNext = () => {
    if (data?.next) {
      const url = new URL(data.next, window.location.origin);
      const p = Number(url.searchParams.get("page") || page + 1);
      setPage(p);
    }
  };
  const goPrev = () => {
    if (data?.previous) {
      const url = new URL(data.previous, window.location.origin);
      const p = Number(url.searchParams.get("page") || Math.max(1, page - 1));
      setPage(p);
    }
  };

  // categories
  const categories = data?.results || [];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header + Create */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">My Categories</h2>
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

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
        />
      </div>

      {/* Category List */}
      {isLoading ? (
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
                  router.push(`/user/dashboard/organizer/categories/${cat.id}`)
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

      {/* Pagination */}
      {categories.length > 0 && (
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Page <span className="font-medium">{page}</span> — showing{" "}
            <span className="font-medium">{categories.length}</span> of{" "}
            <span className="font-medium">{data?.count ?? "—"}</span> categories
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              disabled={!data?.previous || isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-sm disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={goNext}
              disabled={!data?.next || isLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
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
