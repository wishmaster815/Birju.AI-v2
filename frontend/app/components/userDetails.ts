"use client";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

interface User {
  username: string;
  email: string;
  streak: number;
  reward_points: number;
}

export default function useUserDetails() {
  const [user, setUser] = useState<User | null>(null);
  const [userloading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ Extracted fetch logic (kept exactly as in your code)
  const fetchUserDetails = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("No token found");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/user-details/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // ❗ 401 handling
      if (response.status === 401) {
        toast.error("Token expired or invalid. Logging out user.");
        localStorage.removeItem("access_token");
        setUser(null);
        setError("Unauthorized");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch user details (${response.status})`);
      }

      const data: User = await response.json();
      setUser(data);
    } catch (err: any) {
      
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();

    // ✅ Listen for global updates (triggered after login)
    const handleDataUpdated = () => {
      fetchUserDetails(); // refresh user instantly
    };

    window.addEventListener("dataUpdated", handleDataUpdated);

    return () => {
      window.removeEventListener("dataUpdated", handleDataUpdated);
    };
  }, []);

  return { user, userloading, error };
}
