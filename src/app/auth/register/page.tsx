"use client";

import { useForm } from "react-hook-form";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type RegisterForm = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  re_password: string;
};

export default function RegisterPage() {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>();

  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.email?.[0] || errorData.detail || "Registration failed.");
      }

      setSuccess(true);
    } catch (err: any) {
      setServerError(err.message || "Something went wrong.");
    }
  };

  const password = watch("password");

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-600">Create an Account</h2>

        {success ? (
          <div className="bg-green-100 border border-green-300 text-green-800 p-4 rounded">
            Account created successfully! Please check your email to activate your account.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block dark:text-white text-sm font-medium mb-1">First Name</label>
              <input
                type="text"
                {...register("first_name", { required: "First name is required" })}
                className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.first_name && <p className="text-sm text-red-600">{errors.first_name.message}</p>}
            </div>

            {/* Last Name */}
            <div>
              <label className="block dark:text-white text-sm font-medium mb-1">Last Name</label>
              <input
                type="text"
                {...register("last_name", { required: "Last name is required" })}
                className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.last_name && <p className="text-sm text-red-600">{errors.last_name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block dark:text-white text-sm font-medium mb-1">Email Address</label>
              <input
                type="email"
                {...register("email", { required: "Email is required" })}
                className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block dark:text-white text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 6, message: "Minimum 6 characters" },
                })}
                className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {/* Re-Password */}
            <div>
              <label className="block dark:text-white text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                {...register("re_password", {
                  required: "Please confirm your password",
                  validate: (value) => value === password || "Passwords do not match",
                })}
                className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              {errors.re_password && <p className="text-sm text-red-600">{errors.re_password.message}</p>}
            </div>

            {/* Error message */}
            {serverError && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">{serverError}</p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded font-semibold transition"
            >
              {isSubmitting ? "Creating..." : "Register"}
            </button>

            {/* Login Link */}
            <p className="text-sm text-center text-gray-600 mt-4">
              Already have an account?{" "}
              <Link href="/auth/login" className="text-indigo-600 hover:underline">
                Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
