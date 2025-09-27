"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";

type LoginForm = {
  email: string;
  password: string;
};


const quickLoginCredentials = {
  admin: { email: "admin@gmail.com", password: "piash2025" },
  organizer: { email: "jetela6471@artvara.com", password: "SteLukeHDi&^@#84dh" },
  attendee: { email: "bimimor299@artvara.com", password: "NotorHs*34dfhlHds*237*DShs" },
};

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>();

  const { login } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error("Login failed. Please check your credentials.");
      }
    }
  };

  const handleQuickLogin = async (role: keyof typeof quickLoginCredentials) => {
    const creds = quickLoginCredentials[role];
    setLoadingRole(role);
    try {
      await login(creds.email, creds.password);
      setShowModal(false);
      toast.success(`Logged in as ${role}`);
    } catch {
      toast.error("Quick login failed. Please try again.");
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full space-y-6 bg-white dark:bg-gray-900 shadow-lg rounded-xl p-8">
        <h2 className="text-2xl font-bold text-center text-indigo-600">
          Sign in to EventPilot
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block dark:text-white text-sm font-medium mb-1">
              Email
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

          <div>
            <label className="block dark:text-white text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="password"
              {...register("password", { required: "Password is required" })}
              className="w-full px-4 py-2 bg-gray-200 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
            />
            {errors.password && (
              <p className="text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 px-4 text-white bg-indigo-600 hover:bg-indigo-700 rounded font-semibold transition"
          >
            {isSubmitting ? "Signing in..." : "Login"}
          </button>

          {/* Explore Deeply button */}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full py-2 px-4 text-green-600 border border-green-600 bg-green-50 hover:bg-green-100 rounded font-semibold transition mt-2"
          >
            Explore EventPilot Deeply
          </button>

          <div className="mt-4 flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            <p className="text-left">
              Don&apos;t have an account?{" "}
              <Link
                href="/auth/register"
                className="text-indigo-600 hover:underline"
              >
                Sign up
              </Link>
            </p>
            <Link
              href="/auth/forgot-password"
              className="text-indigo-600 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </form>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center px-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-sm w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-center text-indigo-600">
              Quick Login as
            </h3>
            <div className="space-y-3">
              {(Object.keys(quickLoginCredentials) as Array<
                keyof typeof quickLoginCredentials
              >).map((role) => (
                <button
                  key={role}
                  onClick={() => handleQuickLogin(role)}
                  disabled={loadingRole !== null}
                  className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loadingRole === role
                    ? "Logging in..."
                    : `Login as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-2 px-4 border border-gray-400 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
