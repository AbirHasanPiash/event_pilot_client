"use client";

import React from "react";

interface ConfirmModalProps {
  title: string;
  description?: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function ConfirmModal({
  title,
  description,
  isOpen,
  onCancel,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md sm:max-w-lg md:max-w-xl shadow-lg overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>
        {description && (
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
            {description}
          </p>
        )}
        <div className="flex justify-end flex-wrap gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 dark:text-white rounded"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Deleting..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
