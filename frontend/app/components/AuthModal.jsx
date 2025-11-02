"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function AuthModal({ isOpen, onClose, isSignup, toggleMode }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // prevent multiple clicks
    setLoading(true);
    setError("");

    try {
      const url = isSignup
        ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/create/`
        : `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/login/`;

      const body = isSignup
        ? { username, email, password }
        : { username, password };

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      

      if (!res.ok) throw new Error(data.message || "Something went wrong");

      if (isSignup) {
        toast.success("Signup successful! Please login now.");
        toggleMode();
        setUsername("");
        setEmail("");
        setPassword("");
      } else {
        if (data.access_token) {
          // ✅ Only authenticate after response
          localStorage.setItem("access_token", data.access_token);
          window.dispatchEvent(new Event("dataUpdated"));
          toast.success("Login successful!");
          // ✅ Close only after token stored
          onClose();
        } else {
          throw new Error("No access token received. Please try again.");
        }
      }
    } catch (err) {
      
      setError(err.message);
      toast.error(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 px-4">
      <div className="relative w-full max-w-md bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-8 animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={() => {
            if (!loading) onClose(); // prevent closing mid-login
          }}
          disabled={loading}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
        >
          ✕
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-primary-blue)]">
            {isSignup ? "Create an Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {isSignup
              ? "Join BirjuRam AI and begin your journey."
              : "Login to continue your counselling."}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary-blue)] outline-none bg-white/80 disabled:opacity-70"
            />
          </div>

          {isSignup && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary-blue)] outline-none bg-white/80 disabled:opacity-70"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              disabled={loading}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary-blue)] outline-none bg-white/80 disabled:opacity-70"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[var(--color-primary-blue)] hover:opacity-90 text-white rounded-lg font-semibold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading && <Loader2 className="animate-spin w-4 h-4" />}
            {loading
              ? "Please wait..."
              : isSignup
              ? "Sign Up"
              : "Login"}
          </button>
        </form>

        {/* Toggle */}
        <p className="text-sm text-center text-gray-600 mt-6">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => !loading && toggleMode()}
                className="text-[var(--color-primary-blue)] font-medium hover:underline disabled:opacity-50"
                disabled={loading}
              >
                Login
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => !loading && toggleMode()}
                className="text-[var(--color-primary-blue)] font-medium hover:underline disabled:opacity-60"
                disabled={loading}
              >
                Sign Up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
