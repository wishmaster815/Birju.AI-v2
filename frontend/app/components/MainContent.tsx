"use client";

import React, { useState, useEffect } from "react";
import { Map, Compass, HelpCircle } from "lucide-react";
import QuizDetails from "./QuizDetails";
import GlobeAnimation from "./GlobeAnimation";
import { toast } from "react-hot-toast";
import { useQuizDetails } from "./useQuizDetails";
import HelpGuide from "./HelpGuide";

interface MainContentProps {
    activeIcon: string;
    activeCounsel: string | number;
    activeRoadmap: string | number;
    counsels: any[];
    roadmaps: any[];
    setSidebarDisabled?: (value: boolean) => void;
    showHelpGuide: boolean; // Add this prop
    
}

export default function MainContent({
    activeIcon,
    activeCounsel,
    activeRoadmap,
    counsels,
    roadmaps,
    setSidebarDisabled,
    showHelpGuide, // Add this
    
}: MainContentProps) {
    // ✅ ALL HOOKS MUST BE CALLED AT THE TOP LEVEL, BEFORE ANY CONDITIONAL RETURNS

    const sortedCounsels = [...counsels].reverse();
    const sortedRoadmaps = [...roadmaps].reverse();

    const isRoadmap = activeIcon === "map";
    const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);

    // ✅ Find active item by ID or fallback to first item
    const getActiveItem = () => {
        if (isRoadmap) {
            // Try to find by ID first, then by index as fallback
            const itemById = sortedRoadmaps.find(item =>
                item.roadmap_id === activeRoadmap || item.id === activeRoadmap
            );
            if (itemById) return itemById;

            // Fallback: if activeRoadmap is a number, use it as index
            if (typeof activeRoadmap === 'number' && sortedRoadmaps[activeRoadmap]) {
                return sortedRoadmaps[activeRoadmap];
            }

            // Final fallback: return first item
            return sortedRoadmaps[0] || null;
        } else {
            // Try to find by ID first, then by index as fallback
            const itemById = sortedCounsels.find(item =>
                item.counsel_id === activeCounsel
            );
            if (itemById) return itemById;

            // Fallback: if activeCounsel is a number, use it as index
            if (typeof activeCounsel === 'number' && sortedCounsels[activeCounsel]) {
                return sortedCounsels[activeCounsel];
            }

            // Final fallback: return first item
            return sortedCounsels[0] || null;
        }
    };

    const activeItem = getActiveItem();

    // ✅ Move useQuizDetails hook to the top level, always call it unconditionally
    const {
        quizzes,
        currentStage,
        isGenerating,
        generateQuiz,
        fetchQuizzes,
    } = useQuizDetails(activeItem?.roadmap_id, isRoadmap && !!activeItem?.roadmap_id);

    const lastSubmittedQuiz = quizzes
        ?.filter((q: any) => q.submitted)
        .sort(
            (a: any, b: any) =>
                new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
        )[0];

    const today = new Date().toISOString().split("T")[0];
    const lastDate = lastSubmittedQuiz
        ? new Date(lastSubmittedQuiz.submitted_at).toISOString().split("T")[0]
        : null;

    const canGenerateNextQuiz = lastDate !== today;

    // ✅ Scroll effect
    useEffect(() => {
        const mainScrollContainer = document.querySelector(".main-scroll-container");
        if (mainScrollContainer) {
            mainScrollContainer.scrollTo({ top: 0, behavior: "smooth" });
        }
    }, [selectedQuiz]);


    const totalStages = activeItem?.roadmap?.plan?.length || 0;
    const completedAll = (currentStage ?? 0) > totalStages && totalStages > 0;
    const passedStages = Math.max(0, (currentStage ?? 1) - 1);
    const progressPercent = totalStages > 0 ? Math.round((passedStages / totalStages) * 100) : 0;
    // ✅ Show toast once when roadmap is completed
    useEffect(() => {
        if (completedAll) {
            toast.success("🎉 You have completed the entire roadmap!");
        }
    }, [completedAll]);


    if (showHelpGuide) {
    return (
        <div className="w-full h-full overflow-y-auto">
            <div className="py-6 px-4 w-full md:p-10 flex flex-col gap-6 transition-all duration-300">
                <div className="flex items-center gap-3">
                    <HelpCircle size={24} className="text-[var(--color-primary-blue)]" />
                    <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-dark-text)]">
                        Help & Guide
                    </h1>
                </div>
                
                <HelpGuide />
            </div>
        </div>
    );
}



    // ✅ Early return after ALL hooks have been called
    if (!activeItem) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>
                    Select a {isRoadmap ? "roadmap" : "counsel"} from the sidebar to view
                    details.
                </p>
            </div>
        );
    }

    // ✅ Another early return, but now all hooks have been called
    if (selectedQuiz) {
        return (
            <div className="p-6 md:p-10 w-full">
                <QuizDetails
                    quiz={selectedQuiz}
                    onBack={() => {
                        setSelectedQuiz(null);
                        setSidebarDisabled?.(false); // ✅ re-enable sidebar when exiting quiz
                    }}

                    onQuizSubmitted={() => {
                        fetchQuizzes();
                        setSidebarDisabled?.(false); // ✅ re-enable sidebar after submit
                    }}
                />
            </div>
        );
    }

    return (
        <div className="py-6 px-4 w-full md:p-10 flex flex-col gap-6 transition-all duration-300">
            <div className="flex items-center gap-3">
                {isRoadmap ? (
                    <Map size={24} className="text-[var(--color-primary-blue)]" />
                ) : (
                    <Compass size={24} className="text-[var(--color-primary-blue)]" />
                )}
                <h1 className="text-xl md:text-2xl font-semibold text-[var(--color-dark-text)]">
                    {isRoadmap
                        ? activeItem.role || "Untitled Roadmap"
                        : activeItem.input?.field || "Untitled Counsel"}
                </h1>
            </div>

            {/* Main Content */}
            <div>
                {isRoadmap ? (
                    <div className="text-left space-y-6">
                        <h1 className="text-2xl font-medium text-[var(--color-dark-text)] mt-10">
                            Actions to take and Skills to learn Difficulty wise to achieve your goal.
                        </h1>

                        {/* Progress bar (show only if there are stages) */}
                        {totalStages > 0 && (
                            <div className="w-full mt-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium text-[var(--color-dark-text)]">Roadmap Progress</p>
                                    <p className="text-sm font-medium text-[var(--color-dark-text)]">
                                        {passedStages} / {totalStages}
                                    </p>
                                </div>

                                <div className="w-full h-3 bg-[var(--color-light-blue)]/30 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${completedAll ? "bg-green-500" : "bg-[var(--color-primary-blue)]"}`}
                                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                                        aria-valuenow={progressPercent}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                        role="progressbar"
                                    />
                                </div>

                                {/* Small percent label */}
                                <div className="flex justify-end mt-2">
                                    <span className="text-xs text-[var(--color-gray-text)]">{progressPercent}%</span>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {activeItem.roadmap?.overview_stages?.map((stage: any, index: number) => (
                                <div
                                    key={index}
                                    className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]"
                                >
                                    <h2 className="text-lg font-medium text-[var(--color-dark-text)]">
                                        {`Difficulty Level : ${stage.overview_stage}`}
                                    </h2>
                                    <div className="my-5 px-5">
                                        <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                            Actions to take :
                                        </h3>
                                        {stage.actions?.map((action: string, i: number) => (
                                            <li key={i} className="mx-5 text-[var(--color-dark-text)]">
                                                {action}
                                            </li>
                                        ))}
                                    </div>
                                    <div className="my-5 px-5">
                                        <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                            Skills to Learn :
                                        </h3>
                                        {stage.skills?.map((skill: string, i: number) => (
                                            <li key={i} className="mx-5 text-[var(--color-dark-text)]">
                                                {skill}
                                            </li>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Plan Section */}
                        <h1 className="text-2xl font-semibold text-[var(--color-dark-text)] mt-20">
                            Plan to carry out stage wise
                        </h1>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {activeItem.roadmap?.plan?.map((plan: any, index: number) => (
                                <div
                                    key={index}
                                    className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]"
                                >
                                    <h2 className="text-lg font-medium text-[var(--color-dark-text)]">
                                        {`Stage : ${plan.stage}`}
                                    </h2>
                                    <p className="text-[var(--color-gray-text)]">
                                        Approx Days to complete this stage: {plan.approx_days}
                                    </p>
                                    <div className="my-5 px-5">
                                        <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                            Focus areas of this stage :
                                        </h3>
                                        {plan.focus?.map((focusitem: string, i: number) => (
                                            <li key={i} className="mx-5 text-[var(--color-dark-text)]">
                                                {focusitem}
                                            </li>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Quiz Section */}
                        <h1 className="text-2xl font-semibold text-[var(--color-dark-text)] mt-20">
                            Quiz to evaluate your progress
                        </h1>
                        <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]">
                            <div className="grid lg:grid-cols-6 md:grid-cols-4 grid-cols-3 gap-4 justify-between">
                                {quizzes?.length > 0 &&
                                    quizzes.map((quiz: any, index: number) => {
                                        const isFailed = quiz.submitted && quiz.score < 50;
                                        const isPassed = quiz.submitted && quiz.score >= 50;

                                        return (
                                            <div
                                                key={`quiz-${index}`}
                                                onClick={() => {
                                                    setSidebarDisabled?.(true);
                                                    setSelectedQuiz(quiz);
                                                }}
                                                className={`cursor-pointer text-center rounded-2xl p-6 shadow-md transition-transform duration-200
                                                    ${isPassed
                                                        ? "bg-green-300 hover:scale-105"
                                                        : isFailed
                                                            ? "bg-red-300 hover:scale-105"
                                                            : "bg-yellow-300 hover:scale-105"
                                                    }`}
                                            >
                                                S:{quiz.stage}
                                            </div>
                                        );
                                    })}

                                {/* Future placeholders */}
                                {(() => {
                                    const lastQuiz = quizzes?.[quizzes.length - 1];
                                    const lastStage = lastQuiz?.stage || 0;
                                    const shouldRetry =
                                        lastQuiz?.submitted && lastQuiz?.score < 50;
                                    const placeholders = [];

                                    if (shouldRetry) {
                                        placeholders.push(
                                            <div
                                                key={`retry-${lastStage}`}
                                                className="text-center bg-white rounded-2xl p-6 shadow-md opacity-70"
                                            >
                                                S:{lastStage}
                                            </div>
                                        );
                                    }

                                    const remainingCount = Math.max(totalStages - lastStage, 0);
                                    for (let i = 1; i <= remainingCount; i++) {
                                        placeholders.push(
                                            <div
                                                key={`future-${i}`}
                                                className="text-center bg-white rounded-2xl p-6 shadow-md opacity-70"
                                            >
                                                S:{lastStage + i}
                                            </div>
                                        );
                                    }

                                    return placeholders;
                                })()}
                            </div>

                            <div className="mt-8 flex flex-col items-center">
                                {isGenerating ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <GlobeAnimation />
                                        <p className="text-sm text-gray-500">
                                            Generating your new quiz...
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        onClick={completedAll ? undefined : generateQuiz}
                                        disabled={!canGenerateNextQuiz || completedAll}
                                        className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 ${completedAll
                                            ? "bg-green-500 text-white cursor-not-allowed"
                                            : canGenerateNextQuiz
                                                ? "bg-[var(--color-primary-blue)] text-white hover:opacity-90"
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            }`}
                                    >
                                        {completedAll
                                            ? "🎯 Roadmap Complete"
                                            : canGenerateNextQuiz
                                                ? "Generate New Quiz"
                                                : "Available Tomorrow"}
                                    </button>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    /* Counseling report section stays unchanged */
                    <div className="text-left space-y-6">
                        <h1 className="text-2xl font-medium text-[var(--color-dark-text)] mt-10">
                            {activeItem.report?.report_header?.title}
                        </h1>
                        <div>

                            <h2 className="text-xl font-medium text-[var(--color-dark-text)] mt-10">
                                Introduction
                            </h2>
                            <h2 className="text-lg text-[var(--color-dark-text)]">
                                {activeItem.report?.report_header?.introduction}
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {Array.isArray(activeItem.report?.career_pathways) &&
                                activeItem.report.career_pathways.map((career: any, index: number) => (
                                    <div
                                        key={index}
                                        className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]"
                                    >
                                        <h2 className="text-lg font-medium text-[var(--color-dark-text)] mb-2">
                                            {career.role || "Career Pathway"}
                                        </h2>

                                        {/* Role Overview */}
                                        {career.role_overview && (
                                            <div className="space-y-2 mb-4">
                                                <p className="text-md text-[var(--color-dark-text)]">
                                                    {career.role_overview.description}
                                                </p>
                                                <p className="text-md text-[var(--color-dark-text)]">
                                                    {career.role_overview.day_in_the_life}
                                                </p>

                                                {career.role_overview.key_responsibilities?.length > 0 && (
                                                    <div className="my-4">
                                                        <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                                            Key Responsibilities
                                                        </h3>
                                                        <ul className="list-disc ml-6 space-y-1">
                                                            {career.role_overview.key_responsibilities.map(
                                                                (responsibility: string, i: number) => (
                                                                    <li key={i} className="text-[var(--color-dark-text)]">
                                                                        {responsibility}
                                                                    </li>
                                                                )
                                                            )}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Career Path */}
                                        {career.career_path && (
                                            <p className="text-md text-[var(--color-dark-text)] mb-4">
                                                <span className="font-semibold text-[var(--color-dark-text)]">
                                                    Career Path:{" "}
                                                </span>
                                                {career.career_path}
                                            </p>
                                        )}

                                        {/* Expected Salary */}
                                        {career.expected_salary && (
                                            <div className="my-4">
                                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                                    Expected Salary Range
                                                </h3>
                                                <ul className="ml-5 space-y-1 text-[var(--color-dark-text)]">
                                                    <li>Entry Level: {career.expected_salary.entry_level}</li>
                                                    <li>Mid Level: {career.expected_salary.mid_level}</li>
                                                    <li>Senior Level: {career.expected_salary.senior_level}</li>
                                                </ul>
                                            </div>
                                        )}

                                        {/* Skill Gaps */}
                                        {career.skill_gaps?.length > 0 && (
                                            <div className="my-4">
                                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                                    Skill Gaps to Focus On
                                                </h3>
                                                <ul className="list-disc ml-6 space-y-1 text-[var(--color-dark-text)]">
                                                    {career.skill_gaps.map((skill: string, i: number) => (
                                                        <li key={i}>{skill}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Learning Resources */}
                                        {career.recommended_learning_resources?.length > 0 && (
                                            <div className="my-4">
                                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                                    Recommended Learning Resources
                                                </h3>
                                                <ul className="list-disc ml-6 space-y-1 text-[var(--color-dark-text)]">
                                                    {career.recommended_learning_resources.map(
                                                        (resource: string, i: number) => (
                                                            <li key={i}>{resource}</li>
                                                        )
                                                    )}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Future Scope */}
                                        {career.future_scope && (
                                            <div className="my-4">
                                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                                    Future Scope
                                                </h3>
                                                <p className="text-[var(--color-dark-text)]">
                                                    <span className="font-medium text-[var(--color-dark-text)]">
                                                        India:{" "}
                                                    </span>
                                                    {career.future_scope.India}
                                                </p>
                                                <p className="text-[var(--color-dark-text)]">
                                                    <span className="font-medium text-[var(--color-dark-text)]">
                                                        Global:{" "}
                                                    </span>
                                                    {career.future_scope.Global}
                                                </p>
                                            </div>
                                        )}

                                        {/* Networking Tip */}
                                        {career.networking_and_branding_tip && (
                                            <p className="text-md text-[var(--color-dark-text)] my-4">
                                                <span className="text-[var(--color-dark-text)] font-semibold">
                                                    Networking Tip:{" "}
                                                </span>
                                                {career.networking_and_branding_tip}
                                            </p>
                                        )}

                                        {/* BirjuRamAI Promotion */}
                                        {career.birjuramai_promotion && (
                                            <div className="bg-[var(--color-light-bg)] rounded-xl p-4 border mt-4">
                                                <p className="text-[var(--color-dark-text)] italic">
                                                    “{career.birjuramai_promotion}”
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))}

                            {/* Strategic Guidance Section */}
                            <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]">
                                <h2 className="text-lg font-medium text-[var(--color-dark-text)] mb-2">
                                    Recommendation
                                </h2>
                                <p className="text-md text-[var(--color-dark-text)]">
                                    {activeItem.report?.strategic_guidance?.overarching_recommendation}
                                </p>
                            </div>

                            <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]">
                                <h2 className="text-lg font-medium text-[var(--color-dark-text)] mb-2">
                                    Situational Overview
                                </h2>
                                <p className="text-md text-[var(--color-dark-text)]">
                                    {activeItem.report?.strategic_guidance?.situational_overview}
                                </p>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}