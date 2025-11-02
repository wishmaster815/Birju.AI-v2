"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import useRoadmap from "./useRoadmap";

export default function NewRoadmapFormModal({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { generateRoadmap, isGenerating } = useRoadmap();
  const [formData, setFormData] = useState({
    role: "",
    level: "",
    skills: "",
    duration: "",
  });
  const [errors, setErrors] = useState<{duration?: string}>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === "duration") {
      // Only allow positive numbers
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData({ ...formData, [name]: numericValue });
      
      // Clear error when user starts typing
      if (errors.duration) {
        setErrors({});
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const validateForm = () => {
    const newErrors: {duration?: string} = {};
    
    if (!formData.duration || parseInt(formData.duration) < 7) {
      newErrors.duration = "Duration must be at least 7 day";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const res = await generateRoadmap(formData);
    if (res) {
      onClose(); // ✅ close modal
      window.dispatchEvent(new Event("dataUpdated")); // ✅ notify sidebar
      if (onSuccess) onSuccess(); // ✅ refresh parent
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
          // 🌍 Loading animation (same as counsel)
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <motion.div
              className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="absolute inset-0 bg-[url('/globe-pattern.png')] bg-cover opacity-30 rounded-full" />
            </motion.div>
            <p className="text-gray-500 font-medium animate-pulse">
              Generating your personalized roadmap...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-semibold text-center text-[var(--color-dark-text)] mb-4">
              Generate New Roadmap
            </h2>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="e.g., Frontend Developer"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Level</label>
              <input
                type="text"
                name="level"
                value={formData.level}
                onChange={handleChange}
                placeholder="e.g., Beginner or Intermediate"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Skill</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="e.g., React.js, UI Design, etc."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Duration (days)</label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="Enter number of days"
                min="7"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
                  errors.duration ? 'border-red-500' : ''
                }`}
                required
              />
              {errors.duration && (
                <p className="text-red-500 text-xs mt-1">{errors.duration}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[var(--color-primary-blue)] text-white py-2 rounded-lg font-semibold transition hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isGenerating || !formData.duration || parseInt(formData.duration) < 1}
            >
              Generate Roadmap
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}