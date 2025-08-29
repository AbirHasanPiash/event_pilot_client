"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import UpdateRoleModal from "@/components/UpdateRoleModal";
import ConfirmModal from "@/components/ConfirmModal";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import LoadingSpinner from "@/components/LoadingSpinner";

interface UserItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  is_active: boolean;
}

export default function UserDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const safeApiFetch = useSafeApiFetch();

  const [user, setUser] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch user details
  const fetchUser = async () => {
    setLoading(true);
    const data = await safeApiFetch<UserItem>(`/api/users/${id}/`);
    if (data) {
      setUser(data);
    } else {
      toast.error("Failed to fetch user details.");
      router.push("/user/dashboard/admin/users");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  // Handle role update
  const handleRoleUpdate = async (payload: { id: number; role: string | null }) => {
    setSubmitting(true);
    try {
      const result = await safeApiFetch(`/api/users/${payload.id}/set_role/`, {
        method: "PATCH",
        body: JSON.stringify({ role: payload.role }),
      });

      if (result) {
        toast.success("User role updated successfully!");
        setShowUpdateModal(false);
        setUser((prev) => (prev ? { ...prev, role: payload.role } : prev));
      } else {
        toast.error("Failed to update role.");
      }
    } catch {
      toast.error("An error occurred while updating role.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDeleteUser = async () => {
    if (!user) return;
    setDeleteLoading(true);
    try {
      const result = await safeApiFetch(`/api/users/${user.id}/`, {
        method: "DELETE",
      });
      if (result !== null) {
        toast.success("User deleted successfully!");
        router.push("/user/dashboard/admin/users");
      } else {
        toast.error("Failed to delete user.");
      }
    } catch {
      toast.error("An error occurred while deleting user.");
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Details</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUpdateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
          >
            Update Role
          </button>
          {!user.is_active && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Delete User
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="border rounded-lg shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 p-6 flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-3xl font-bold text-white shadow-md">
            {user.first_name?.[0]}
            {user.last_name?.[0]}
          </div>
          <h2 className="mt-4 text-lg font-semibold">
            {user.first_name} {user.last_name}
          </h2>
          <p className="text-sm text-gray-500">{user.email}</p>

          <div className="flex gap-2 mt-3 flex-wrap justify-center">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                user.role === "admin"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/30"
                  : user.role === "organizer"
                  ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/20"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-800"
              }`}
            >
              {user.role ?? "—"}
            </span>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                user.is_active
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30"
                  : "bg-red-100 text-red-800 dark:bg-red-900/30"
              }`}
            >
              {user.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Info Card */}
        <div className="lg:col-span-2 border rounded-lg shadow-sm bg-white dark:bg-gray-900 border-gray-200 dark:border-white/10 p-6 space-y-4">
          <h3 className="text-lg font-semibold">Account Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">First Name</p>
              <p className="font-medium">{user.first_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Last Name</p>
              <p className="font-medium">{user.last_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">
                {user.is_active ? "Active" : "Inactive"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UpdateRoleModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={handleRoleUpdate}
        user={user}
        loading={submitting}
      />

      <ConfirmModal
        isOpen={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description={`Are you sure you want to delete ${user.first_name} ${user.last_name}? This action cannot be undone.`}
        loading={deleteLoading}
        confirmText="Delete"
      />
    </div>
  );
}
