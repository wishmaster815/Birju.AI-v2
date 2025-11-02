"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import useUserDetails from "./userDetails"; // ✅ import user hook

export default function useRoadmap() {
  const [hasRoadmap, setHasRoadmap] = useState(false);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeletingRoadmap, setIsDeletingRoadmap] = useState(false);

  const { user, userloading: userLoading } = useUserDetails(); // ✅ get user state

  

  // ✅ Fetch user roadmap
  const fetchUserRoadmap = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roadmap/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setHasRoadmap(!!data.response);
      setRoadmaps(data.response || []);
      
    } catch (err) {
      
      // toast.error("❌ Failed to fetch roadmap data.");
    }
  }, [process.env.NEXT_PUBLIC_BACKEND_URL]);

  // ✅ Only fetch after user is fetched and valid
  useEffect(() => {
    if (!userLoading && user && user.email) {
      fetchUserRoadmap();
    } else {
      // reset when user is guest or not ready
      setHasRoadmap(false);
      setRoadmaps([]);
    }
  }, [user, userLoading, fetchUserRoadmap]);

  // ✅ Generate roadmap
  const generateRoadmap = useCallback(
    async (formData: any) => {
      if (!user || !user.email) {
        toast.error("Please log in to generate your roadmap.");
        return;
      }

      setIsGenerating(true);
      try {
        const token = localStorage.getItem("access_token") || "";
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roadmap/generate/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to generate roadmap.");

        toast.success("🎯 Roadmap generated successfully!");
        await fetchUserRoadmap();
        return data;
      } catch (err) {
       
        toast.error("❌ Failed to generate roadmap. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [user, process.env.NEXT_PUBLIC_BACKEND_URL, fetchUserRoadmap]
  );

  // ✅ Delete roadmap
  const deleteRoadmap = useCallback(
    async (roadmapId: string) => {
      if (!user || !user.email) {
        toast.error("Please log in to manage your roadmap.");
        return;
      }

      setIsDeletingRoadmap(true);
      try {
        const token = localStorage.getItem("access_token") || "";
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/roadmap/${roadmapId}/`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to delete roadmap.");

        toast.success("🗑️ Roadmap deleted successfully!");
        await fetchUserRoadmap();
      } catch (err) {
        
        // toast.error("❌ Failed to delete roadmap. Please try again.");
      } finally {
        setIsDeletingRoadmap(false);
      }
    },
    [user, process.env.NEXT_PUBLIC_BACKEND_URL, fetchUserRoadmap]
  );

  return {
    roadmaps,
    hasRoadmap,
    isGenerating,
    isDeletingRoadmap,
    fetchUserRoadmap,
    generateRoadmap,
    deleteRoadmap,
  };
}
