"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import useCounseling from "./useCounseling";

export default function NewCounselFormModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { generateCounsel, isGenerating } = useCounseling();
  const [formData, setFormData] = useState({
    education: "",
    field: "",
    intent: "",
    skills: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const isFormValid =
    formData.education.trim() &&
    formData.field.trim() &&
    formData.intent.trim() &&
    formData.skills.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    const res = await generateCounsel(formData);
    if (res) {
      onClose();
      window.dispatchEvent(new Event("dataUpdated"));
      if (onSuccess) onSuccess();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 w-[90%] max-w-md relative"
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
        >
          ✕
        </button>

        {isGenerating ? (
          // 🌍 Loading animation
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <motion.div
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-[url('/globe-pattern.png')] bg-cover opacity-30 rounded-full" />
            </motion.div>
            <p className="text-gray-500 font-medium animate-pulse">
              Generating your personalized counsel...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-semibold text-center text-[var(--color-dark-text)] mb-4">
              Generate New Counsel
            </h2>

            {/* Input fields */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Education
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g., Bachelor's in Computer Science"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Field
              </label>
              <input
                type="text"
                name="field"
                value={formData.field}
                onChange={handleChange}
                placeholder="e.g., Web Development"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Intent
              </label>
              <input
                type="text"
                name="intent"
                value={formData.intent}
                onChange={handleChange}
                placeholder="e.g., Learn backend development"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Skills
              </label>
              <textarea
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="List your current skills, e.g., JavaScript, React, Node.js"
                rows={3}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                required
              />
            </div>

            {/* ✅ Same button logic as NewRoadmapFormModal */}
            <button
              type="submit"
              className="w-full bg-[var(--color-primary-blue)] text-white py-2 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isGenerating || !isFormValid}
            >
              Generate Counsel
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
