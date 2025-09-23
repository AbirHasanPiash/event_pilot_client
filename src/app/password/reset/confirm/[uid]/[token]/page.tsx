"use client";

import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useSafeApiFetch } from "@/lib/apiWrapper";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type ResetData = {
  new_password: string;
  re_new_password: string;
};

export default function ResetPasswordConfirmPage() {
  const { uid, token } = useParams();
  const apiFetch = useSafeApiFetch();
  const router = useRouter();
  const { logout } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetData>();
  const [serverError, setServerError] = useState("");

  const onSubmit = async (data: ResetData) => {
    setServerError("");

    if (data.new_password !== data.re_new_password) {
      setServerError("Passwords do not match.");
      return;
    }

    try {
      await apiFetch("/auth/users/reset_password_confirm/", {
        method: "POST",
        body: JSON.stringify({
          uid,
          token,
          new_password: data.new_password,
          re_new_password: data.re_new_password,
        }),
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Password reset successful!");
      logout();
      router.push("/auth/login");
    } catch (err: unknown) {
      console.error("Reset failed:", err);
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("Invalid or expired reset link.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-600">
          Reset Your Password
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              New Password
            </label>
            <input
              type="password"
              {...register("new_password", {
                required: "New password is required",
              })}
              className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 
              focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.new_password && (
              <p className="text-sm text-red-600">
                {errors.new_password.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-white">
              Confirm Password
            </label>
            <input
              type="password"
              {...register("re_new_password", {
                required: "Confirm your password",
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
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            Already reset?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-600 hover:underline"
            >
              Back to login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
