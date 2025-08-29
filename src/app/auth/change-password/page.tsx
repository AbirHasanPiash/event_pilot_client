"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/api";

type PasswordChangeForm = {
  current_password: string;
  new_password: string;
  re_new_password: string;
};

export default function ChangePasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeForm>();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const onSubmit = async (data: PasswordChangeForm) => {
    setServerError("");

    if (data.new_password !== data.re_new_password) {
      setServerError("New passwords do not match.");
      return;
    }

    try {
      await toast.promise(
        apiFetch("/auth/users/set_password/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            current_password: data.current_password,
            new_password: data.new_password,
          }),
        }),
        {
          loading: "Updating password...",
          success: "Password changed successfully! Please log in again.",
          error: (err) => err.message || "Failed to change password.",
        }
      );

      router.push("/auth/login");
    } catch {
      // Don't redirect — error message already handled by toast
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-600">
          Change Password
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block dark:text-white text-sm font-medium mb-1">
              Current Password
            </label>
            <input
              type="password"
              {...register("current_password", {
                required: "Current password is required",
              })}
              className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.current_password && (
              <p className="text-sm text-red-600">
                {errors.current_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block dark:text-white text-sm font-medium mb-1">
              New Password
            </label>
            <input
              type="password"
              {...register("new_password", {
                required: "New password is required",
              })}
              className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.new_password && (
              <p className="text-sm text-red-600">
                {errors.new_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block dark:text-white text-sm font-medium mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register("re_new_password", {
                required: "Please confirm your new password",
              })}
              className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.re_new_password && (
              <p className="text-sm text-red-600">
                {errors.re_new_password.message}
              </p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
              {serverError}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded font-semibold transition"
          >
            {isSubmitting ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
