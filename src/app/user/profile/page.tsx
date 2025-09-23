"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { Pencil, Trash, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import Link from "next/link";

interface Profile {
  bio: string;
  phone: string;
  address: string;
  organization: string;
  profile_image: string | null;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const apiFetch = useSafeApiFetch();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Profile>();

  useEffect(() => {
    apiFetch<Profile>("/api/profile/me/").then(setProfile);
  }, [apiFetch]);

  useEffect(() => {
    if (profile) reset(profile);
  }, [profile, reset]);

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      await apiFetch("/auth/users/reset_password/", {
        method: "POST",
        body: JSON.stringify({ email: user.email }),
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Password reset email sent!");
    } catch (err) {
      console.error("Password reset failed", err);
      toast.error("Failed to send reset email.");
    }
  };

  const onSubmit = async (data: Profile) => {
    try {
      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        // Exclude image, it's handled separately
        if (key === "profile_image") continue;
        if (typeof value === "string") {
          formData.append(key, value);
        }
      }

      const updated = await apiFetch<Profile>("/api/profile/me/", {
        method: "PATCH",
        body: formData,
      });

      setProfile(updated);
      setEditMode(false);
      toast.success("Profile updated!");
    } catch (err) {
      console.error("Update failed", err);
      toast.error("Profile update failed.");
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("profile_image", file);

    try {
      const updated = await apiFetch<Profile>("/api/profile/me/", {
        method: "PUT",
        body: formData,
      });
      setProfile(updated);
      toast.success("Profile image updated!");
    } catch (err) {
      console.error("Image upload failed", err);
      toast.error("Failed to upload image.");
    }
  };

  const handleImageDelete = async () => {
    if (!profile) return;
    setShowDeleteConfirm(false);

    const oldProfile = profile;
    setProfile({ ...profile, profile_image: null });

    try {
      await apiFetch("/api/profile/me/", {
        method: "PATCH",
        body: JSON.stringify({ profile_image: null }),
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Profile image deleted.");
    } catch (err) {
      console.error("Image delete failed", err);
      setProfile(oldProfile);
      toast.error("Failed to delete image.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black pt-32 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-xl p-8">
        {/* Image Section */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-28 h-28">
            {profile?.profile_image ? (
              <Image
                src={profile.profile_image}
                alt="Profile"
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center text-3xl font-bold">
                {user?.first_name[0]}
              </div>
            )}

            <div className="absolute -bottom-2 -right-2 flex gap-2">
              {profile?.profile_image ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="bg-red-600 p-1 rounded-full text-white hover:bg-red-700"
                  title="Remove image"
                >
                  <Trash size={16} />
                </button>
              ) : (
                <label
                  className="cursor-pointer bg-indigo-600 p-1 rounded-full text-white hover:bg-indigo-700"
                  title="Upload image"
                >
                  <UploadCloud size={16} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {user?.email}
            </p>
            <p className="text-sm text-indigo-600 capitalize">{user?.role}</p>
          </div>
        </div>

        <hr className="my-6 border-gray-200 dark:border-white/10" />

        {/* Profile Details */}
        {editMode ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {["bio", "phone", "address", "organization"].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium mb-1 capitalize dark:text-white">
                  {field}
                </label>
                <input
                  {...register(field as keyof Profile)}
                  className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none 
                  focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            ))}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  reset(profile!);
                  setEditMode(false);
                }}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-gray-700 dark:text-gray-300 mt-4">
            <p>
              <strong>Bio:</strong> {profile?.bio || "-"}
            </p>
            <p>
              <strong>Phone:</strong> {profile?.phone || "-"}
            </p>
            <p>
              <strong>Address:</strong> {profile?.address || "-"}
            </p>
            <p>
              <strong>Organization:</strong> {profile?.organization || "-"}
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-4 mt-6">
              <button>
                <Link
                  href="/auth/change-password"
                  className="px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-600 hover:text-white"
                >
                  Change Password
                </Link>
              </button>
              <button
                onClick={handlePasswordReset}
                className="px-4 py-2 text-sm text-indigo-600 border border-indigo-600 rounded hover:bg-indigo-600 hover:text-white"
              >
                Reset Password
              </button>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1"
              >
                <Pencil size={16} /> Edit Profile
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Profile Image?"
          description="Are you sure you want to remove your profile image? This action cannot be undone."
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleImageDelete}
          confirmText="Delete"
        />
      )}
    </div>
  );
}
