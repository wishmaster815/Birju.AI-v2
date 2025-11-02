"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "react-hot-toast";
import useUserDetails from "./userDetails";



export default function useCounseling() {
  const [hasCounselling, setHasCounselling] = useState(false);
  const [counsels, setCounsels] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeletingCounsel, setIsDeleting] = useState(false);
  const { user, userloading: userLoading } = useUserDetails();

  // ✅ Fetch counseling reports
  const fetchUserCounselling = useCallback(async () => {
    const token = localStorage.getItem("access_token") || "";
    if (!token) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/career/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setHasCounselling(!!data.reports);
      setCounsels(data.reports || []);
      
    } catch (err) {
      
      // toast.error("❌ Failed to fetch counseling data.");
    }
  }, []);

  // ✅ Automatically fetch when user is ready
  useEffect(() => {
    if (!userLoading && user && user.email) {
      // Only fetch if a real user exists (not guest)
      fetchUserCounselling();
    } else {
      // Reset state if user not yet available or guest
      setHasCounselling(false);
      setCounsels([]);
    }
  }, [user, userLoading, fetchUserCounselling]);

  // ✅ Generate new counsel
  const generateCounsel = useCallback(
    async (formData: any) => {
      if (!user || !user.email) {
        toast.error("Please log in to generate your career counsel.");
        return;
      }

      setIsGenerating(true);
      try {
        const token = localStorage.getItem("access_token") || "";
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/career/counsel/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to generate counsel.");

        toast.success("🎯 Career counsel generated successfully!");
        await fetchUserCounselling();
        return data;
      } catch (err) {
        
        toast.error("❌ Failed to generate counsel. Please try again.");
      } finally {
        setIsGenerating(false);
      }
    },
    [user, fetchUserCounselling]
  );

  // ✅ Delete existing counsel
  const deleteCounsel = useCallback(
    async (counselId: string) => {
      if (!user || !user.email) {
        toast.error("Please log in to manage your counsel.");
        return;
      }

      setIsDeleting(true);
      try {
        const token = localStorage.getItem("access_token") || "";
        if (!token) return;

        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/career/${counselId}/`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to delete counsel.");

        toast.success("🗑️ Counsel deleted successfully!");
        await fetchUserCounselling();
      } catch (err) {
        
        // toast.error("❌ Failed to delete counsel. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    },
    [user, fetchUserCounselling]
  );

  return {
    counsels,
    hasCounselling,
    isGenerating,
    isDeletingCounsel,
    fetchUserCounselling,
    generateCounsel,
    deleteCounsel,
  };
}
