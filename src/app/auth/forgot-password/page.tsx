"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api"; // or useSafeApiFetch if you prefer
import Link from "next/link";

type FormData = {
  email: string;
};

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const [serverError, setServerError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    setServerError("");

    try {
      await apiFetch("/auth/users/reset_password/", {
        method: "POST",
        body: JSON.stringify({ email: data.email }),
        headers: { "Content-Type": "application/json" },
      });

      setEmailSent(true);
      toast.success("Password reset email sent!");
    } catch (err: any) {
      setServerError(err.message || "Failed to send reset email.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-600">
          Forgot Password
        </h2>

        {emailSent ? (
          <p className="text-center text-green-600">
            If an account with that email exists, a reset link has been sent. Check your inbox.
          </p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block dark:text-white text-sm font-medium mb-1">
                Enter your email
              </label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
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
              {isSubmitting ? "Sending..." : "Send Reset Email"}
            </button>
          </form>
        )}

        <p className="text-sm text-center text-gray-600 mt-4">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-indigo-600 hover:underline">
            Go back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
