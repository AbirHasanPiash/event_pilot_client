"use client";

import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";

interface UserItem {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  is_active: boolean;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: { id: number; role: string | null }) => void;
  user?: UserItem | null;
  loading?: boolean;
};

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "organizer", label: "Organizer" },
  { value: "attendee", label: "Attendee" },
];

export default function UpdateRoleModal({
  isOpen,
  onClose,
  onSubmit,
  user = null,
  loading = false,
}: Props) {
  const [role, setRole] = useState<string | null>(user?.role ?? "attendee");

  useEffect(() => {
    if (isOpen) {
      setRole(user?.role ?? "attendee");
    }
    // only run when opening modal
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ id: user.id, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg space-y-4"
      >
        <div className="flex items-center gap-3">
          <Pencil className="text-indigo-600" />
          <h2 className="text-lg font-semibold">Update Role</h2>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">User</label>
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
            {user.first_name} {user.last_name} — <span className="text-gray-500">{user.email}</span>
          </div>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">
            Role
          </label>
          <select
            id="role"
            name="role"
            value={role ?? ""}
            onChange={(e) => setRole(e.target.value ?? null)}
            required
            className="w-full px-4 py-2 border rounded dark:bg-gray-800 border-gray-300 dark:border-gray-600"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Choose the user&apos;s role. Admin has full access, Organizer can manage events, Attendee has limited access.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {loading ? "Saving..." : "Update Role"}
          </button>
        </div>
      </form>
    </div>
  );
}
