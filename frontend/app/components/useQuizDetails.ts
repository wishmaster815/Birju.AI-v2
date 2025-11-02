"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";

/**
 * Hook to handle quiz fetching, generation, and state management for a roadmap
 * @param roadmapId - ID of the active roadmap
 * @param isRoadmap - boolean, ensures logic only runs when viewing a roadmap
 */
export function useQuizDetails(roadmapId?: string, isRoadmap: boolean = false) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [currentStage, setCurrentStage] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /** ✅ Fetch quizzes */
  const fetchQuizzes = useCallback(async () => {
    if (!isRoadmap || !roadmapId) return;

    const token = localStorage.getItem("access_token");
    if (!token) {
      
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/quiz/${encodeURIComponent(roadmapId)}/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        toast.error("🚫 Unauthorized. Token may be invalid or expired.");
        localStorage.removeItem("access_token");
        window.dispatchEvent(new Event("dataUpdated"));
        return;
      }

      if (!response.ok) {
        
        return;
      }

      const data = await response.json();
      setQuizzes(data.response || []);
      setCurrentStage(data.current_stage || null);
      
    } catch (err) {
      
    } finally {
      setIsLoading(false);
    }
  }, [roadmapId, isRoadmap]);

  /** ✅ Generate new quiz */
  const generateQuiz = useCallback(async () => {
    if (!roadmapId) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      setIsGenerating(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/quiz/generate/${roadmapId}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to generate quiz");
      const data = await res.json();
      
      toast.success("🎯 Quiz generated successfully!");

      // Fetch updated quizzes
      await fetchQuizzes();
    } catch (err) {
      
      toast.error("Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  }, [roadmapId, fetchQuizzes]);

  /** ✅ Auto-fetch when roadmapId changes */
  useEffect(() => {
    fetchQuizzes();
  }, [fetchQuizzes]);

  return {
    quizzes,
    currentStage,
    isGenerating,
    isLoading,
    fetchQuizzes,
    generateQuiz,
    setQuizzes, // optional, if you want to manually update from child component
  };
}
