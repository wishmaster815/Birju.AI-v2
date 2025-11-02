"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { PanelRightOpen } from "lucide-react";
import AuthModal from "./components/AuthModal";
import Sidebar from "./components/Sidebar";
import NewCounselFormModal from "./components/NewCounselFormModal";
import NewRoadmapFormModal from "./components/NewRoadmapFormModal";

// ✅ Custom hooks
import useCounsel from "./components/useCounseling";
import useRoadmap from "./components/useRoadmap";
import MainContent from "./components/MainContent";
import MainContentSkeleton from "./components/MainContentSkeleton";
import useUserDetails from "./components/userDetails";

export default function CounselingApp() {
  // Change to handle IDs instead of indices
  const [activeCounsel, setActiveCounsel] = useState<string | number>(-1);
  const [activeRoadmap, setActiveRoadmap] = useState<string | number>(-1);
  const [activeIcon, setActiveIcon] = useState("compass");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { user, userloading } = useUserDetails();
  const [isCounselModalOpen, setIsCounselModalOpen] = useState(false);
  const [isRoadmapModalOpen, setIsRoadmapModalOpen] = useState(false);
  const [isMainContentLoading, setIsMainContentLoading] = useState(true);
  const [sidebarDisabled, setSidebarDisabled] = useState(false);
  const [showHelpGuide, setshowHelpGuide] = useState(false);

  // ✅ use your custom hooks
  const { counsels, hasCounselling, fetchUserCounselling } = useCounsel();
  const { roadmaps, hasRoadmap, fetchUserRoadmap } = useRoadmap();
  

  // Detect mobile screens
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load user and data on mount
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!userloading) {
      if (token && user) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [user, userloading, token]);


  useEffect(() => {
    const handleOpenAuthModal = () => setIsOpen(true);

    // ✅ Listen for event from Sidebar
    window.addEventListener("openAuthModal", handleOpenAuthModal);

    return () => {
      window.removeEventListener("openAuthModal", handleOpenAuthModal);
    };
  }, []);

  // ✅ Set latest item as active when data loads or new item is generated
  useEffect(() => {
    if (counsels.length > 0 && activeIcon === "compass" && !showHelpGuide) {
      // Set the latest counsel as active (first item after reverse)
      const sortedCounsels = [...counsels].reverse();
      const latestCounsel = sortedCounsels[0];
      if (latestCounsel && latestCounsel.counsel_id && activeCounsel === -1) {
        setActiveCounsel(latestCounsel.counsel_id);
      }
    }
  }, [counsels, activeIcon, showHelpGuide, activeCounsel]);

  useEffect(() => {
    if (roadmaps.length > 0 && activeIcon === "map" && !showHelpGuide) {
      // Set the latest roadmap as active (first item after reverse)
      const sortedRoadmaps = [...roadmaps].reverse();
      const latestRoadmap = sortedRoadmaps[0];
      if (latestRoadmap && (latestRoadmap.roadmap_id || latestRoadmap.id) && activeRoadmap === -1) {
        setActiveRoadmap(latestRoadmap.roadmap_id || latestRoadmap.id);
      }
    }
  }, [roadmaps, activeIcon, showHelpGuide, activeRoadmap]);

  // ✅ Also set latest item when switching between compass and map
  useEffect(() => {
    if (activeIcon === "compass" && counsels.length > 0 && !showHelpGuide) {
      const sortedCounsels = [...counsels].reverse();
      const latestCounsel = sortedCounsels[0];
      if (latestCounsel && latestCounsel.counsel_id && activeCounsel === -1) {
        setActiveCounsel(latestCounsel.counsel_id);
      }
    } else if (activeIcon === "map" && roadmaps.length > 0 && !showHelpGuide) {
      const sortedRoadmaps = [...roadmaps].reverse();
      const latestRoadmap = sortedRoadmaps[0];
      if (latestRoadmap && (latestRoadmap.roadmap_id || latestRoadmap.id) && activeRoadmap === -1) {
        setActiveRoadmap(latestRoadmap.roadmap_id || latestRoadmap.id);
      }
    }
  }, [activeIcon, counsels, roadmaps, showHelpGuide, activeCounsel, activeRoadmap]);

  // Fetch data and handle loading state
  useEffect(() => {
    const fetchData = async () => {
      setIsMainContentLoading(true);
      try {
        await Promise.all([fetchUserRoadmap(), fetchUserCounselling()]);
      } finally {
        setIsMainContentLoading(false);
      }
    };

    if (token || user) {
      fetchData();
    } else {
      setIsMainContentLoading(false);
    }
  }, [fetchUserRoadmap, fetchUserCounselling, token, user]);

  // ✅ Render main content based on state
  const renderMainContent = () => {
    // ✅ Help Guide takes highest priority
    if (showHelpGuide) {
      return (
        <div className="w-full">
          <MainContent
            activeIcon={activeIcon}
            activeCounsel={activeCounsel}
            activeRoadmap={activeRoadmap}
            counsels={counsels}
            roadmaps={roadmaps}
            setSidebarDisabled={setSidebarDisabled}
            showHelpGuide={showHelpGuide}
          />
        </div>
      );
    }

    // ✅ If user is creating new OR has no data
    if (isCreatingNew ||
      (activeIcon === "compass" && counsels.length === 0) ||
      (activeIcon === "map" && roadmaps.length === 0)) {
      return (
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-8">
            <Image
              src="/birju-logo.png"
              alt="BIRJU BYTES"
              width={80}
              height={80}
              className="object-contain md:w-[100px] md:h-[100px]"
            />
          </div>

          <div className="mb-4">
            {userloading ? (
              // Username skeleton
              <div className="h-12 bg-gray-200 rounded-lg w-48 animate-pulse mb-4"></div>
            ) : (
              <h1
                className="text-3xl md:text-5xl font-bold mb-4"
                style={{ color: "var(--color-dark-text)" }}
              >
                Hi, {user?.username || "Birju's Guest"}!
              </h1>
            )}
          </div>

          {activeIcon === "compass" ? (
            <div>
              <p
                className="text-base md:text-xl mb-12"
                style={{ color: "var(--color-gray-text)" }}
              >
                Do you need a counsel today?
              </p>

              <button
                disabled={userloading}
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsOpen(true); // show auth modal
                  } else {
                    setIsCounselModalOpen(true); // open counsel modal
                  }
                }}
                className={`text-white px-6 md:px-8 py-3 text-sm md:text-base rounded-lg font-semibold transition hover:opacity-90 shadow-md ${userloading ? "opacity-60 pointer-events-none" : ""}`}
                style={{ backgroundColor: "var(--color-primary-blue)" }}
              >
                Start Counsel Now!!
              </button>
            </div>
          ) : (
            <div>
              <p
                className="text-base md:text-xl mb-12"
                style={{ color: "var(--color-gray-text)" }}
              >
                Wanna achieve something new?
              </p>

              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setIsOpen(true);
                  } else {
                    setIsRoadmapModalOpen(true); // ✅ Open roadmap modal
                  }
                }}
                className={`text-white px-6 md:px-8 py-3 text-sm md:text-base rounded-lg font-semibold transition hover:opacity-90 shadow-md ${userloading ? "opacity-60 pointer-events-none" : ""}`}
                style={{ backgroundColor: "var(--color-primary-blue)" }}
              >
                Generate Roadmap Now!!
              </button>
            </div>
          )}
        </div>
      );
    }

    // ✅ Active Content Area (when a counsel/roadmap is selected)
    if (isMainContentLoading) {
      return <MainContentSkeleton />;
    }

    return (
      <MainContent
        activeIcon={activeIcon}
        activeCounsel={activeCounsel}
        activeRoadmap={activeRoadmap}
        counsels={counsels}
        roadmaps={roadmaps}
        setSidebarDisabled={setSidebarDisabled}
        showHelpGuide={showHelpGuide}
      />
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-light-bg)]">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        activeIcon={activeIcon}
        setActiveIcon={setActiveIcon}
        user={user}
        activeCounsel={activeCounsel}
        activeRoadmap={activeRoadmap}
        setActiveCounsel={setActiveCounsel}
        setActiveRoadmap={setActiveRoadmap}
        setIsCreatingNew={setIsCreatingNew}
        sidebarDisabled={sidebarDisabled}
        showHelpGuide={showHelpGuide}
        setshowHelpGuide={setshowHelpGuide}
      />

      {/* Mobile Open Button */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="fixed top-5 left-5 z-30 md:hidden bg-white border p-2 rounded-lg shadow-sm"
          style={{
            borderColor: "var(--color-light-blue)",
            color: "var(--color-gray-text)",
          }}
        >
          <PanelRightOpen size={22} />
        </button>
      )}

      {/* Main Content */}
      <div
  className={`flex-1 main-scroll-container h-screen overflow-y-auto p-4 md:p-0 transition-all bg-[var(--color-light-bg)] flex flex-col
    ${showHelpGuide 
      ? "items-start justify-start" // Help Guide should use normal layout
      : isCreatingNew ||
        (activeIcon === "compass" && counsels.length === 0) ||
        (activeIcon === "map" && roadmaps.length === 0)
        ? "items-center justify-center"
        : "items-start justify-start"
    }`}
>
        {renderMainContent()}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          const token = localStorage.getItem("access_token");
          if (token) {
            setIsAuthenticated(true);
            fetchUserRoadmap();
            fetchUserCounselling();
          }
        }}
        isSignup={isSignup}
        toggleMode={() => setIsSignup(!isSignup)}
      />
      <NewCounselFormModal
        isOpen={isCounselModalOpen}
        onClose={() => setIsCounselModalOpen(false)}
        onSuccess={() => {
          fetchUserCounselling();
          setIsCreatingNew(false);
          // The latest item will be automatically selected by the useEffect above
        }}
      />
      <NewRoadmapFormModal
        isOpen={isRoadmapModalOpen}
        onClose={() => setIsRoadmapModalOpen(false)}
        onSuccess={() => {
          fetchUserRoadmap();
          setIsCreatingNew(false);
          // The latest item will be automatically selected by the useEffect above
        }}
      />
    </div>
  );
}