"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/app/components/ui/card";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";

// 👇 You can import this JSON from a separate file if you prefer
import helpData from "./data/helpData.json"; // or paste JSON directly below

export default function HelpGuide() {
    return (
        <div className="text-left space-y-6">
            <h1 className="text-2xl font-medium text-[var(--color-dark-text)] mt-10">
                {helpData.title}
            </h1>

            <div className="space-y-8">
                {helpData.steps.map((step, index) => (
                    <div
                        key={step.step}
                        className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]"
                    >
                        {/* Step Header */}
                        <div className="flex items-start gap-4 mb-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-[var(--color-primary-blue)] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                {step.step}
                            </div>
                            <h2 className="text-lg font-medium text-[var(--color-dark-text)]">
                                {step.title}
                            </h2>
                        </div>

                        {/* Description */}
                        <p className="text-[var(--color-dark-text)] mb-4">
                            {step.description}
                        </p>

                        {/* Actions */}
                        {step.actions && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Actions:
                                </h3>
                                <ul className="space-y-1 ml-5">
                                    {step.actions.map((action, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)] flex items-start gap-2">
                                            <span className="text-[var(--color-primary-blue)] mt-1">•</span>
                                            <span>{action}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Details */}
                        {step.details && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Details:
                                </h3>
                                <ul className="space-y-1 ml-5">
                                    {step.details.map((detail, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)]">
                                            {detail}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Features */}
                        {step.features && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Features:
                                </h3>
                                <ul className="space-y-2 ml-5">
                                    {step.features.map((feature, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)] flex items-start gap-2">
                                            <span className="mt-1">{feature}</span>
                                            
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Extra */}
                        {step.extra && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Additional Options:
                                </h3>
                                <ul className="space-y-1 ml-5">
                                    {step.extra.map((item, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)]">
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Form Fields */}
                        {step.form_fields && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Form Fields:
                                </h3>
                                <ul className="space-y-2 ml-5">
                                    {step.form_fields.map((field, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)] flex items-start gap-2">
                                            <span className="mt-1">{field}</span>

                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Action */}
                        {step.action && (
                            <div className="my-4 p-3 bg-[var(--color-light-bg)] rounded-lg border border-[var(--color-light-blue)]">
                                <p className="text-[var(--color-dark-text)] font-medium">
                                    {step.action}
                                </p>
                            </div>
                        )}

                        {/* Contents */}
                        {step.contents && (
                            <div className="my-4 space-y-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Report Contents:
                                </h3>

                                {step.contents.includes && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 text-[var(--color-dark-text)]">
                                            Includes:
                                        </h4>
                                        <ul className="space-y-1 ml-5">
                                            {step.contents.includes.map((item, i) => (
                                                <li key={i} className="text-[var(--color-dark-text)]">
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {step.contents.job_role_details && (
                                    <div>
                                        <h4 className="text-sm font-semibold mb-2 text-[var(--color-dark-text)]">
                                            Job Role Details:
                                        </h4>
                                        <ul className="space-y-1 ml-5">
                                            {step.contents.job_role_details.map((detail, i) => (
                                                <li key={i} className="text-[var(--color-dark-text)]">
                                                    {detail}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {step.contents.final_note && (
                                    <div className="p-3 bg-[var(--color-light-bg)] rounded-lg border border-[var(--color-light-blue)]">
                                        <p className="text-[var(--color-dark-text)]">
                                            {step.contents.final_note}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Roadmap Features */}
                        {step.roadmap_features && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Roadmap Features:
                                </h3>
                                <ul className="space-y-2 ml-5">
                                    {step.roadmap_features.map((feature, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)] flex items-start gap-2">
                                            <span className="text-[var(--color-primary-blue)] mt-1">•</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Quiz Flow */}
                        {step.quiz_flow && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Quiz Process:
                                </h3>
                                <ul className="space-y-2 ml-5">
                                    {step.quiz_flow.map((flow, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)] flex items-start gap-2">
                                            <span className="text-[var(--color-primary-blue)] mt-1">•</span>
                                            <span>{flow}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Rules */}
                        {step.rules && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Reward System:
                                </h3>
                                <ul className="space-y-2 ml-5">
                                    {step.rules.map((rule, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)] flex items-start gap-2">
                                            <span className="mt-1">{rule}</span>

                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Note */}
                        {step.note && (
                            <div className="my-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <p className="text-[var(--color-dark-text)] text-sm">
                                    <span className="font-semibold">Note: </span>
                                    {step.note}
                                </p>
                            </div>
                        )}

                        {/* Features List */}
                        {step.features && !step.form_fields && (
                            <div className="my-4">
                                <h3 className="text-md font-semibold mb-2 text-[var(--color-dark-text)]">
                                    Features:
                                </h3>
                                <ul className="space-y-1 ml-5">
                                    {step.features.map((feature, i) => (
                                        <li key={i} className="text-[var(--color-dark-text)]">
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Screenshot Placeholder */}
                        {step.screenshot && (
                            <div className="my-4">
                                <div className="bg-[var(--color-light-bg)] rounded-lg border border-[var(--color-light-blue)] overflow-hidden">
                                    
                                    <div className="p-4 flex justify-center items-center">
                                        <img
                                            src={`/${step.screenshot}`}
                                            alt={`Screenshot for ${step.title}`}
                                            className="rounded-lg shadow-sm border border-[var(--color-light-blue)] max-w-full h-auto"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
