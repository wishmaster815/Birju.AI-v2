"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    MessageCircle,
    PanelRightClose,
    PanelRightOpen,
    Settings,
    HelpCircle,
    Compass,
    Map,
    Trash2
} from "lucide-react";
import useCounsel from "./useCounseling";
import useRoadmap from "./useRoadmap";
import useUserDetails from "./userDetails";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "../components/ui/popover"


interface SidebarProps {
    isCollapsed: boolean;
    setIsCollapsed: (value: boolean) => void;
    isMobile: boolean;
    isMobileOpen: boolean;
    setIsMobileOpen: (value: boolean) => void;
    activeIcon: string;
    setActiveIcon: (value: string) => void;
    user: { username: string; email: string; streak: number; reward_points: number } | null;
    activeCounsel: string | number;
    activeRoadmap: string | number;
    setActiveCounsel: (value: string | number) => void;
    setActiveRoadmap: (value: string | number) => void;
    setIsCreatingNew: (value: boolean) => void;
    sidebarDisabled: boolean;
    showHelpGuide: boolean;
    setshowHelpGuide: (value: boolean) => void;
}

export default function Sidebar({
    isCollapsed,
    setIsCollapsed,
    isMobile,
    isMobileOpen,
    setIsMobileOpen,
    activeIcon,
    setActiveIcon,
    user,
    activeCounsel,
    activeRoadmap,
    setActiveCounsel,
    setActiveRoadmap,
    setIsCreatingNew,
    sidebarDisabled,
    showHelpGuide,
    setshowHelpGuide
}: SidebarProps) {
    const [hoveredIcon, setHoveredIcon] = useState<string | null>(null);
    const [hoveredItem, setHoveredItem] = useState<number | null>(null);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
    const [hoveredHelp, setHoveredHelp] = useState(false); // ✅ Add hover state for Help button

    const { counsels, fetchUserCounselling, deleteCounsel, isDeletingCounsel } = useCounsel();
    const { roadmaps, fetchUserRoadmap, deleteRoadmap, isDeletingRoadmap } = useRoadmap();
    const { user: fetchedUser, userloading: isUserLoading } = useUserDetails();
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);


    useEffect(() => {
        const token = localStorage.getItem("access_token");

        // ✅ Fetch data if token or user is available
        if (token || fetchedUser) {
            setIsDataLoading(true);
            Promise.all([fetchUserRoadmap(), fetchUserCounselling()])
                .finally(() => {
                    setIsDataLoading(false);
                });
        } else {
            setIsDataLoading(false);
        }

        // ✅ Listen for global updates (when roadmap or counsel is generated)
        const handleDataUpdated = () => {
            fetchUserRoadmap();
            fetchUserCounselling();
        };

        window.addEventListener("dataUpdated", handleDataUpdated);

        return () => {
            window.removeEventListener("dataUpdated", handleDataUpdated);
        };
    }, [fetchedUser, fetchUserRoadmap, fetchUserCounselling]);

    const sortedCounsels = [...counsels].reverse();
    const sortedRoadmaps = [...roadmaps].reverse();

    const items =
        activeIcon === "map"
            ? sortedRoadmaps.map((r) => ({
                title: r.role || "Untitled Roadmap",
                id: r.roadmap_id || r.id
            }))
            : sortedCounsels.map((c) => ({
                title: c.input?.field || "Untitled Counsel",
                id: c.counsel_id
            }));

    // ✅ Helper function to check if an item is active by ID
    const isItemActive = (itemId: string, index: number) => {
        if (activeIcon === "map") {
            // Check if activeRoadmap matches the item ID or index
            return activeRoadmap === itemId || activeRoadmap === index;
        } else {
            // Check if activeCounsel matches the item ID or index
            return activeCounsel === itemId || activeCounsel === index;
        }
    };

    // ✅ Helper function to find item index by ID for deletion logic
    const findItemIndexById = (itemId: string) => {
        return items.findIndex(item => item.id === itemId);
    };

    const handleHelpClick = () => {
        setshowHelpGuide(true);
        setIsCreatingNew(false);
        // ✅ Reset active counsel/roadmap states when Help is clicked
        setActiveCounsel(-1);
        setActiveRoadmap(-1);
        if (isMobile) {
            setIsMobileOpen(false);
        }
    };

    // ✅ Helper function to find the previous active item ID after deletion
    const findPreviousItemId = (currentIndex: number) => {
        if (currentIndex > 0) {
            // Return the ID of the item above
            return items[currentIndex - 1].id;
        } else if (items.length > 1) {
            // If it's the first item, return the ID of the next item
            return items[1].id;
        } else {
            // No items left
            return null;
        }
    };

    // Handle delete operations and track which item is being deleted
    const handleDeleteRoadmap = async (roadmapId: string, isActiveItem: boolean, itemIndex: number) => {
        setDeletingItemId(roadmapId);

        // Check if this is the last item
        const isLastItem = sortedRoadmaps.length === 1;

        if (isActiveItem) {
            if (isLastItem) {
                // If it's the last item, show the "New Roadmap" screen
                setIsCreatingNew(true);
                setActiveRoadmap(-1); // Reset active roadmap
                setshowHelpGuide(false); // ✅ Hide help when deleting active item
            } else {
                // Find the ID of the previous item to set as active
                const previousItemId = findPreviousItemId(itemIndex);
                if (previousItemId) {
                    setActiveRoadmap(previousItemId);
                    setshowHelpGuide(false); // ✅ Hide help when switching to another item
                }
            }
        }

        await deleteRoadmap(roadmapId);
        setDeletingItemId(null);
    };

    const handleDeleteCounsel = async (counselId: string, isActiveItem: boolean, itemIndex: number) => {
        setDeletingItemId(counselId);

        // Check if this is the last item
        const isLastItem = sortedCounsels.length === 1;

        if (isActiveItem) {
            if (isLastItem) {
                // If it's the last item, show the "New Counsel" screen
                setIsCreatingNew(true);
                setActiveCounsel(-1); // Reset active counsel
                setshowHelpGuide(false); // ✅ Hide help when deleting active item
            } else {
                // Find the ID of the previous item to set as active
                const previousItemId = findPreviousItemId(itemIndex);
                if (previousItemId) {
                    setActiveCounsel(previousItemId);
                    setshowHelpGuide(false); // ✅ Hide help when switching to another item
                }
            }
        }

        await deleteCounsel(counselId);
        setDeletingItemId(null);
    };

    const buttonLabel = activeIcon === "map" ? "New Roadmap" : "New Counsel";

    // Check if an item is currently being deleted
    const isItemDeleting = (itemId: string) => {
        return deletingItemId === itemId;
    };

    return (
        <div
            className={`fixed md:static top-0 left-0 z-40 h-screen bg-white flex flex-col border-r overflow-hidden transition-all duration-300
    ${isMobile
                    ? isMobileOpen
                        ? "translate-x-0 w-80"
                        : "-translate-x-full w-80"
                    : isCollapsed
                        ? "w-20 translate-x-0"
                        : "w-80 translate-x-0"
                }
                ${sidebarDisabled ? "opacity-60 pointer-events-none" : ""}
  `}
            style={{ borderColor: "var(--color-light-blue)" }}
        >

            {/* Header */}
            <div
                className={`border-b flex items-center justify-between transition-all duration-300 ${isCollapsed ? "flex-col py-4 gap-3" : "px-6 py-6"
                    }`}
                style={{ borderColor: "var(--color-light-blue)" }}
            >
                <div className={`flex items-center ${isCollapsed ? "flex-col" : "gap-3"} transition-all`}>
                    <Image
                        src="/birju-logo.png"
                        alt="Birju.Ai"
                        width={isCollapsed ? 36 : 40}
                        height={isCollapsed ? 36 : 40}
                        className="object-contain"
                    />
                    {!isCollapsed && (
                        <span className="font-semibold text-md" style={{ color: "var(--color-dark-text)" }}>
                            Birju.Ai
                        </span>
                    )}
                </div>

                <button
                    onClick={() => (isMobile ? setIsMobileOpen(false) : setIsCollapsed(!isCollapsed))}
                    className="p-2 rounded-lg transition hover:bg-[var(--color-light-bg)]"
                    style={{ color: "var(--color-gray-text)" }}
                >
                    {isMobile ? (
                        <PanelRightClose size={20} />
                    ) : isCollapsed ? (
                        <PanelRightOpen size={20} />
                    ) : (
                        <PanelRightClose size={20} />
                    )}
                </button>
            </div>

            {/* Icons */}
            <div className={`px-6 py-4 flex ${isCollapsed ? "flex-col items-center gap-4" : "gap-3"}`}>
                {[
                    { id: "compass", icon: Compass },
                    { id: "map", icon: Map },
                ].map(({ id, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => {
                            setActiveIcon(id);
                            setshowHelpGuide(false); // ✅ Hide help when switching icons
                        }}
                        onMouseEnter={() => setHoveredIcon(id)}
                        onMouseLeave={() => setHoveredIcon(null)}
                        className={`p-3 rounded-full border transition ${isCollapsed ? "" : "flex-shrink-0"}`}
                        style={{
                            borderColor:
                                activeIcon === id ? "var(--color-primary-blue)" : "var(--color-gray-text)",
                            color: activeIcon === id ? "var(--color-primary-blue)" : "var(--color-gray-text)",
                            backgroundColor:
                                activeIcon === id
                                    ? "rgba(0, 112, 243, 0.1)"
                                    : hoveredIcon === id
                                        ? "var(--color-light-bg)"
                                        : "transparent",
                        }}
                    >
                        <Icon size={20} />
                    </button>
                ))}
            </div>

            {/* New Button */}
            <div className={`px-6 pb-4 ${isCollapsed ? "flex justify-center" : ""}`}>
                <button
                    onClick={() => { 
                        setIsCreatingNew(true); 
                        setshowHelpGuide(false); 
                        if (isMobile) setIsMobileOpen(false); 
                    }}
                    className={`text-white rounded-full p-3 flex items-center justify-center gap-2 font-semibold transition hover:opacity-90 shadow-md ${isCollapsed ? "w-12 h-12 " : "w-full"
                        }`}
                    style={{ backgroundColor: "var(--color-primary-blue)" }}
                >
                    <MessageCircle size={20} />
                    {!isCollapsed && <span>{buttonLabel}</span>}
                </button>
            </div>

            {/* Scrollable History Section */}
            {!isCollapsed && (
                <div className="flex-1 overflow-y-auto px-6">
                    <div className="flex flex-col gap-1">
                        {/* Loading Skeleton when data is being fetched */}
                        {isDataLoading ? (
                            // Show loading skeletons when data is loading
                            Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="relative group animate-pulse"
                                >
                                    <div className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg">
                                        {/* Left side: icon + name skeleton */}
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>
                                            <div className="h-4 bg-gray-200 rounded flex-1 max-w-[120px]"></div>
                                        </div>

                                        {/* Right side: delete icon skeleton */}
                                        <div className="w-4 h-4 bg-gray-200 rounded opacity-0"></div>
                                    </div>
                                </div>
                            ))
                        ) : items.length === 0 ? (
                            // Show empty state when data is loaded but no items
                            <div className="text-center py-8">
                                <div className="text-gray-400 text-sm">
                                    No {activeIcon === "map" ? "roadmaps" : "counsels"} yet
                                </div>
                            </div>
                        ) : (
                            // Show actual items when data is loaded
                            items.map((item, index) => {
                                const ItemIcon = activeIcon === "map" ? Map : Compass;
                                const isActive = isItemActive(item.id, index);
                                const isDeleting = isItemDeleting(item.id);

                                return (
                                    <div
                                        key={index}
                                        className="relative group"
                                    >
                                        {/* Show skeleton overlay when item is being deleted */}
                                        {isDeleting && (
                                            <div className="absolute inset-0 bg-white bg-opacity-80 z-10 rounded-lg animate-pulse">
                                                <div className="w-full h-full flex items-center justify-between gap-3 px-4 py-3">
                                                    <div className="flex items-center gap-3 flex-1">
                                                        <div className="w-5 h-5 bg-gray-200 rounded-full flex-shrink-0"></div>
                                                        <div className="h-4 bg-gray-200 rounded flex-1 max-w-[120px]"></div>
                                                    </div>
                                                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Main clickable area */}
                                        <div
                                            onClick={() => {
                                                if (!isDeleting) {
                                                    setIsCreatingNew(false);
                                                    setshowHelpGuide(false); // ✅ Hide help when clicking items
                                                    // Always set the ID, not the index
                                                    activeIcon === "map"
                                                        ? setActiveRoadmap(item.id)
                                                        : setActiveCounsel(item.id);
                                                }
                                            }}
                                            onMouseEnter={() => !isDeleting && setHoveredItem(index)}
                                            onMouseLeave={() => !isDeleting && setHoveredItem(null)}
                                            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition text-left cursor-pointer ${isDeleting ? 'opacity-50' : ''}`}
                                            style={{
                                                color: isActive
                                                    ? "var(--color-dark-text)"
                                                    : "var(--color-gray-text)",
                                                backgroundColor: isActive
                                                    ? "rgba(0, 112, 243, 0.1)"
                                                    : hoveredItem === index
                                                        ? "var(--color-light-bg)"
                                                        : "transparent",
                                                boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (!isDeleting && (e.key === 'Enter' || e.key === ' ')) {
                                                    e.preventDefault();
                                                    setIsCreatingNew(false);
                                                    setshowHelpGuide(false); // ✅ Hide help when selecting items
                                                    activeIcon === "map"
                                                        ? setActiveRoadmap(item.id)
                                                        : setActiveCounsel(item.id);
                                                }
                                            }}
                                        >
                                            {/* Left side: icon + name */}
                                            <div className="flex items-center gap-3">
                                                <ItemIcon size={18} className="flex-shrink-0" />
                                                <span className="text-sm">{item.title}</span>
                                            </div>

                                            {/* Right side: delete icon (hidden until hover) */}
                                            {!isDeleting && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // ✅ prevent parent click

                                                        // Check if the item being deleted is currently active
                                                        const isActiveItem = isItemActive(item.id, index);

                                                        // Conditionally call delete function based on activeIcon
                                                        if (activeIcon === "map") {
                                                            handleDeleteRoadmap(item.id, isActiveItem, index);
                                                        } else {
                                                            handleDeleteCounsel(item.id, isActiveItem, index);
                                                        }
                                                    }}
                                                    className="md:opacity-0 opacity-100 md:group-hover:opacity-100 transition-opacity duration-200 text-red-500 hover:text-red-600 cursor-pointer"
                                                    title={activeIcon === "map" ? "Delete roadmap" : "Delete counsel"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Sticky Settings + Help + User Section */}
            <div
                className={`flex flex-col mt-auto border-t bg-white ${isCollapsed ? "items-center" : ""}`}
                style={{ borderColor: "var(--color-light-blue)" }}
            >
                {/* Settings + Help */}
                <div className={`w-full ${isCollapsed ? "flex flex-col items-center" : "px-6 py-4"}`} >
                    {[{ icon: HelpCircle, label: "Help" }].map(
                        ({ icon: Icon, label }, idx) => (
                            <button
                                key={idx}
                                onClick={handleHelpClick}
                                onMouseEnter={() => setHoveredHelp(true)}
                                onMouseLeave={() => setHoveredHelp(false)}
                                className={`flex items-center gap-3 rounded-lg transition w-full ${isCollapsed ? "justify-center p-3" : "px-4 py-3 text-left"
                                    }`}
                                style={{
                                    color: showHelpGuide ? "var(--color-primary-blue)" : "var(--color-gray-text)",
                                    backgroundColor: showHelpGuide 
                                        ? "rgba(0, 112, 243, 0.1)" 
                                        : hoveredHelp 
                                            ? "var(--color-light-bg)" 
                                            : "transparent",
                                    boxShadow: showHelpGuide ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
                                }}
                            >
                                <Icon size={18} className="flex-shrink-0" />
                                {!isCollapsed && <span className="text-sm">{label}</span>}
                            </button>
                        )
                    )}
                </div>

                {/* User Profile Section */}
                <div
                    className="flex flex-col mt-auto border-t bg-white w-full"
                    style={{ borderColor: "var(--color-light-blue)" }}
                >
                    <div
                        className={`w-full py-4 flex ${isCollapsed ? "justify-center" : "items-center px-6"}`}
                    >
                        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                            <PopoverTrigger asChild>
                                <button
                                    className={`flex items-center gap-3 w-full transition rounded-lg ${isCollapsed ? "justify-center p-3" : "px-3 py-2"
                                        } hover:bg-[var(--color-light-bg)]`}
                                >
                                    <div className="h-10 w-10 rounded-full overflow-hidden border border-[var(--color-light-blue)] shadow-sm flex-shrink-0">
                                        <Image
                                            src="/birju-logo.png"
                                            alt="User Avatar"
                                            width={40}
                                            height={40}
                                            className="object-cover w-full h-full"
                                        />
                                    </div>

                                    {!isCollapsed && (
                                        <div className="flex flex-col flex-1 text-left">
                                            {isUserLoading ? (
                                                <>
                                                    <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-32 animate-pulse"></div>
                                                </>
                                            ) : (
                                                <>
                                                    <span
                                                        className="text-sm font-medium"
                                                        style={{ color: "var(--color-dark-text)" }}
                                                    >
                                                        {fetchedUser?.username || "Guest User"}
                                                    </span>
                                                    {fetchedUser?.reward_points !== undefined && (
                                                        <span
                                                            className="text-xs"
                                                            style={{ color: "var(--color-gray-text)" }}
                                                        >
                                                            ⭐ {fetchedUser.reward_points} pts | 🔥 {fetchedUser.streak} streak
                                                        </span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </button>
                            </PopoverTrigger>

                            {/* Popover Content */}
                            <PopoverContent
                                align="end"
                                sideOffset={10}
                                className="w-64 p-4 rounded-xl shadow-lg border bg-white"
                            >
                                {isUserLoading ? (
                                    <div className="space-y-3 animate-pulse">
                                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                        <div className="h-8 bg-gray-200 rounded w-full"></div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 rounded-full overflow-hidden border border-[var(--color-light-blue)] shadow-sm">
                                                <Image
                                                    src="/birju-logo.png"
                                                    alt="User Avatar"
                                                    width={40}
                                                    height={40}
                                                    className="object-cover w-full h-full"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {fetchedUser?.username || "Guest User"}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {fetchedUser?.email || "Not signed in"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-xs text-gray-600 space-y-1 mb-3">
                                            <p>⭐ Reward Points: {fetchedUser?.reward_points ?? 0}</p>
                                            <p>🔥 Quiz Streak: {fetchedUser?.streak ?? 0}</p>
                                        </div>

                                        <button
                                            onClick={() => {
                                                if (fetchedUser) {
                                                    // ✅ Logout: remove token and refresh
                                                    localStorage.removeItem("access_token");
                                                    window.location.reload();
                                                } else {
                                                    // ✅ Close the popover first
                                                    setIsPopoverOpen(false);

                                                    // ✅ Then open AuthModal in page.tsx
                                                    const event = new Event("openAuthModal");
                                                    window.dispatchEvent(event);
                                                }
                                            }}
                                            className="w-full text-sm font-semibold text-white bg-[var(--color-primary-blue)] rounded-lg py-2 transition hover:opacity-90"
                                        >
                                            {fetchedUser ? "Log Out" : "Log In"}
                                        </button>
                                    </>
                                )}
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    );
}