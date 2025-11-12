"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  content: string;
  status: string;
  created_at: string;
}

export default function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [lessonId, setLessonId] = useState<string | null>(null);

  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params;
      setLessonId(unwrappedParams.id);
    };
    
    unwrapParams();
  }, [params]);

  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId) return;
      
      try {
        const response = await fetch(`/api/lessons/${lessonId}`);
        const data = await response.json();
        
        if (response.ok) {
          setLesson(data);
        } else {
          setError(data.error || "Failed to fetch lesson");
        }
      } catch (err) {
        setError("Error fetching lesson");
        console.error("Error fetching lesson:", err);
      } finally {
        setLoading(false);
      }
    };

    if (lessonId) {
      fetchLesson();
    }
  }, [lessonId]);

  if (loading && !lessonId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading lesson...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Lesson not found</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="mb-6 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-800"
        >
          ← Back to Lessons
        </button>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold">{lesson.title}</h1>
            <span className={`px-3 py-1 rounded-full text-sm ${
              lesson.status === "generated" 
                ? "bg-green-100 text-green-800" 
                : lesson.status === "generating" 
                  ? "bg-yellow-100 text-yellow-800" 
                  : "bg-red-100 text-red-800"
            }`}>
              {lesson.status.charAt(0).toUpperCase() + lesson.status.slice(1)}
            </span>
          </div>
          
          {lesson.status === "generating" ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-lg">Generating your lesson...</p>
              <p className="text-gray-500 mt-2">This may take a few moments</p>
            </div>
          ) : (
            <div className="prose max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap font-sans">
                {lesson.content}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}