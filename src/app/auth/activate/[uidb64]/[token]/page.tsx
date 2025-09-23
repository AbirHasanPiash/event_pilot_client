"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as React from "react";

export default function ActivatePage({
  params,
}: {
  params: Promise<{ uidb64: string; token: string }>;
}) {
  const { uidb64, token } = React.use(params);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    const activateUser = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/activate/${uidb64}/${token}/`,
          { method: "GET" }
        );

        if (!res.ok) {
          throw new Error("Activation failed or link expired.");
        }

        setStatus("success");
        setMessage("Your account has been activated! You can now log in.");
        setTimeout(() => router.push("/auth/login"), 3000);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setStatus("error");
          setMessage(err.message);
        } else {
          setStatus("error");
          setMessage("Invalid activation link.");
        }
      }
    };

    activateUser();
  }, [uidb64, token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50 dark:bg-black">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg p-8 text-center">
        {status === "loading" && <p className="text-indigo-500">Activating your account...</p>}
        {status === "success" && <p className="text-green-600 font-medium">{message}</p>}
        {status === "error" && <p className="text-red-600 font-medium">{message}</p>}
      </div>
    </div>
  );
}
