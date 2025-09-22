"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Pencil, Trash2, ArrowLeft, ArrowRight, Search } from "lucide-react";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";
import UpdateRoleModal from "@/components/UpdateRoleModal";
import ConfirmModal from "@/components/ConfirmModal";

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface UserItem {
  id: number;
  first_name: string;
  last_name: string;
  role: string | null;
  is_active: boolean;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const safeApiFetch = useSafeApiFetch();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [count, setCount] = useState(0);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Utility: update URL params
  const updateUrl = (newSearch: string, newPage: number) => {
    const params = new URLSearchParams();
    if (newSearch) params.set("search", newSearch);
    params.set("page", String(newPage));
    router.replace(`/user/dashboard/admin/users?${params.toString()}`);
  };

  // Fetch users
  const loadUsers = async (query: string, page: number) => {
    setLoading(true);
    const url = `/api/users/?search=${encodeURIComponent(query)}&page=${page}`;
    const data = await safeApiFetch<PaginatedResponse<UserItem>>(url);
    if (data) {
      setUsers(data.results);
      setCount(data.count);
      setNextUrl(data.next);
      setPrevUrl(data.previous);
    }
    setLoading(false);
  };

  // Sync search + page changes
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      updateUrl(searchTerm, 1);
      loadUsers(searchTerm, 1);
    }, 450);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    loadUsers(searchTerm, currentPage);
  }, [currentPage]);

  // Initial load
  useEffect(() => {
    loadUsers(searchTerm, currentPage);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const openUpdateModal = (user: UserItem) => {
    setEditingUser(user);
    setShowUpdateModal(true);
  };

  const handleRoleUpdate = async ({ id, role }: { id: number; role: string | null }) => {
    setSubmitting(true);
    try {
      const result = await safeApiFetch(`/api/users/${id}/set_role/`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      if (result) {
        toast.success("User role updated successfully!");
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
        setShowUpdateModal(false);
        setEditingUser(null);
      } else toast.error("Failed to update role.");
    } catch {
      toast.error("An error occurred while updating role.");
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (user: UserItem) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      const result = await safeApiFetch(`/api/users/${deletingUser.id}/`, {
        method: "DELETE",
      });
      if (result !== null) {
        toast.success("User deleted successfully!");
        setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
        setShowDeleteModal(false);
        setDeletingUser(null);
      } else toast.error("Failed to delete user.");
    } catch {
      toast.error("An error occurred while deleting user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    updateUrl(searchTerm, page);
  };

  const navigateToDetails = (id: number) =>
    router.push(`/user/dashboard/admin/users/${id}`);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Users</h2>
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search user by name or email..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10 pr-4 py-2 w-full rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-800"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-600">
        Showing <b>{users.length}</b> of <b>{count}</b> users
      </div>

      {loading ? (
        <div className="py-12">
          <LoadingSpinner />
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-gray-500">No users found.</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-lg shadow-sm">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigateToDetails(u.id)}
                        className="hover:text-indigo-600 text-medium cursor-pointer"
                      >
                        {u.first_name} {u.last_name}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          u.role === "admin"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                            : u.role === "organizer"
                            ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800"
                        }`}
                      >
                        {u.role ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={u.is_active ? "text-green-600" : "text-red-600"}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {!u.is_active && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(u);
                          }}
                          className="px-3 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openUpdateModal(u);
                        }}
                        className="px-3 py-1 rounded-md border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                      >
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-4 md:hidden">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">
                    <button
                      onClick={() => navigateToDetails(u.id)}
                      className="font-medium hover:text-indigo-600 cursor-pointer"
                    >
                      {u.first_name} {u.last_name}
                    </button>
                  </h3>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      u.role === "admin"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                        : u.role === "organizer"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-800"
                    }`}
                  >
                    {u.role ?? "—"}
                  </span>
                </div>
                <div className="mt-2 text-sm">
                  <span className={u.is_active ? "text-green-600" : "text-red-600"}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  {!u.is_active && (
                    <button
                      onClick={() => openDeleteModal(u)}
                      className="flex-1 px-3 py-1 rounded-md border border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 text-sm"
                    >
                      Delete
                    </button>
                  )}
                  <button
                    onClick={() => openUpdateModal(u)}
                    className="flex-1 px-3 py-1 rounded-md border border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-sm"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
            <span className="text-sm text-gray-600">Page {currentPage}</span>
            <div className="flex gap-2 w-full sm:w-auto justify-center">
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={!prevUrl}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition w-full sm:w-auto ${
                  prevUrl
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <ArrowLeft size={16} /> Prev
              </button>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={!nextUrl}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition w-full sm:w-auto ${
                  nextUrl
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modals */}
      <UpdateRoleModal
        isOpen={showUpdateModal}
        onClose={() => {
          setShowUpdateModal(false);
          setEditingUser(null);
        }}
        onSubmit={handleRoleUpdate}
        user={editingUser ?? undefined}
        loading={submitting}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeletingUser(null);
        }}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${deletingUser?.first_name} ${deletingUser?.last_name}? This action cannot be undone.`}
        loading={deleteLoading}
        confirmText="Delete"
      />
    </div>
  );
}
