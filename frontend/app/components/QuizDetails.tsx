"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "react-hot-toast";

interface QuizDetailsProps {
  quiz: any;
  onBack: () => void;
  onQuizSubmitted: () => void;

}

export default function QuizDetails({ quiz, onBack, onQuizSubmitted }: QuizDetailsProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [quizResult, setQuizResult] = useState<any>(null);


  

  // ✅ Initialize selectedAnswers as { "0": "", "1": "", ... }
  useEffect(() => {
    if (quiz?.questions) {
      const initAnswers: { [key: string]: string } = {};
      quiz.questions.forEach((_: any, i: number) => {
        initAnswers[i.toString()] = "";
      });
      setSelectedAnswers(initAnswers);
    }
  }, [quiz]);



  const handleOptionSelect = (qIndex: number, optionKey: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex.toString()]: optionKey, // ✅ Store the key (A, B, C, D)
    }));
  };

  const handleSubmit = async () => {
    if (!quiz?.quiz_id) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("Access token not found.");

      const answers: Record<string, string> = {};
      Object.entries(selectedAnswers).forEach(([key, value]) => {
        answers[String(key)] = value;
      });

      const payload = { answers };
      

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/quiz/submit/${quiz.roadmap_id}/${quiz.quiz_id}/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to submit quiz.");

      toast.success("✅ Quiz submitted successfully");

      // ✅ Immediately show result locally
      setSubmitSuccess(true);

      setQuizResult(data);

      if (onQuizSubmitted) {
        onQuizSubmitted();
      }// assuming API returns quiz results (score, answers, etc.)
      onBack();
    } catch (err: any) {
      setSubmitError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };



  // ✅ Check if all questions answered
  const allAnswered = useMemo(() => {
    return Object.values(selectedAnswers).every((ans) => ans !== "");
  }, [selectedAnswers]);

  return (
    <div  className="w-full flex flex-col gap-6">
      <button
        onClick={onBack}
        className="self-start text-[var(--color-primary-blue)] text-sm hover:underline"
      >
        ← Back to Roadmap
      </button>

      <div className="w-full bg-white rounded-2xl p-6 shadow-md border border-[var(--color-light-blue)]">
        <h2 className="text-2xl font-semibold text-[var(--color-dark-text)] mb-2">
          Quiz - Stage {quiz.stage}
        </h2>
        <p className="text-[var(--color-gray-text)] mb-4">
          {quiz.submitted
            ? "Your quiz results"
            : "Answer the questions below to test your understanding."}
        </p>

        {!quiz.submitted ? (
          <div className="space-y-6">
            {quiz.questions?.map((q: any, index: number) => (
              <div
                key={index}
                className="border border-[var(--color-light-blue)] rounded-xl p-4"
              >
                <h3 className="font-medium text-left text-[var(--color-dark-text)] mb-3">
                  {index + 1}. {q.question}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(q.options as Record<string, string>)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <button
                        key={key}
                        onClick={() => !isSubmitting && handleOptionSelect(index, key)} // ✅ prevent selection while submitting
                        disabled={isSubmitting || submitSuccess} // ✅ lock options after submit
                        className={`border rounded-xl px-4 py-2 text-left transition-all duration-200 w-full
              ${selectedAnswers[index.toString()] === key
                            ? "bg-[var(--color-primary-blue)] text-white border-[var(--color-primary-blue)]"
                            : "bg-white border-[var(--color-light-blue)] hover:bg-[var(--color-light-blue)]/20"
                          }
              ${isSubmitting || submitSuccess ? "opacity-50 cursor-not-allowed" : ""}
            `}
                      >
                        <span className="font-semibold mr-2">{key}.</span> {value}
                      </button>
                    ))}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className={`text-white px-6 md:px-8 bg-[var(--color-primary-blue)] disabled:opacity-60 py-3 text-sm md:text-base rounded-lg font-semibold transition  shadow-md
                ${allAnswered && !isSubmitting
                  ? " hover:opacity-90 cursor-pointer"
                  : "cursor-not-allowed"
                }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>

            {submitSuccess && (
              <p className="text-green-600 text-sm font-medium">
                ✅ Quiz submitted successfully!
              </p>
            )}
            {submitError && (
              <p className="text-red-600 text-sm font-medium">{submitError}</p>
            )}
          </div>
        ) : (
          /* ========== SUBMITTED RESULT MODE ========== */
          <div className="space-y-6">
            <div
              className={`p-4 border rounded-xl ${quiz.score && quiz.score < 50
                ? "bg-red-50 border-red-300"
                : "bg-green-50 border-[var(--color-light-blue)]"
                }`}
            >
              <h3
                className={`font-medium text-[var(--color-dark-text)] mb-2 ${quiz.score && quiz.score < 50 ? "text-red-700" : "text-green-700"
                  }`}
              >
                Your Result
              </h3>

              <p className="text-[var(--color-gray-text)]">
                Score:{" "}
                <span
                  className={`font-semibold ${quiz.score && quiz.score < 50 ? "text-red-700" : "text-green-700"
                    }`}
                >
                  {quiz.score ?? "N/A"}
                </span>
              </p>

              <p className="text-[var(--color-gray-text)]">
                Feedback:{" "}
                <span className="font-semibold">
                  {quiz.score && quiz.score < 50
                    ? "You need to reattempt the quiz to improve your understanding."
                    : quiz.feedback || "Great effort! Keep going."}
                </span>
              </p>
            </div>


            {quiz.questions?.map((q: any, index: number) => {
              const userAnswer = quiz.user_answers?.[index];
              const correctAnswer = q.answer;

              return (
                <div
                  key={index}
                  className="border border-[var(--color-light-blue)] rounded-xl p-4"
                >
                  <h3 className="font-medium text-left text-[var(--color-dark-text)] mb-3">
                    {index + 1}. {q.question}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(q.options as Record<string, string>)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([key, value]) => {
                        const isUserAnswer = key === userAnswer;
                        const isCorrect = key === correctAnswer;
                        const isWrong = isUserAnswer && !isCorrect;

                        return (
                          <div
                            key={key}
                            className={`border rounded-xl px-4 py-2 text-left w-full transition-all duration-200
                              ${isCorrect
                                ? "bg-green-100 border-green-500 text-green-800"
                                : isWrong
                                  ? "bg-red-100 border-red-500 text-red-700"
                                  : "bg-white border-[var(--color-light-blue)] text-gray-700"
                              }`}
                          >
                            <span className="font-semibold mr-2">{key}.</span> {value}
                            {isCorrect && (
                              <span className="ml-2 text-green-600 font-semibold">✓</span>
                            )}
                            {isWrong && (
                              <span className="ml-2 text-red-600 font-semibold">✗</span>
                            )}
                          </div>
                        );
                      })}
                  </div>


                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
