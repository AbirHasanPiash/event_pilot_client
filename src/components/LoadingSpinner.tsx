"use client";

export default function LoadingSpinner({
  size = 48,
  color = "border-indigo-600",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className={`animate-spin rounded-full border-4 border-t-transparent ${color}`}
        style={{ width: size, height: size }}
      ></div>
    </div>
  );
}
