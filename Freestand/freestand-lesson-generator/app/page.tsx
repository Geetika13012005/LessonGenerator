"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Lesson {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

export default function Home() {
  const [lessonOutline, setLessonOutline] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch lessons from the API
  useEffect(() => {
    const fetchLessons = async () => {
      try {
        console.log("Fetching lessons from API...");
        const response = await fetch("/api/lessons");
        console.log("Response status:", response.status);
        
        const data = await response.json();
        console.log("Response data:", data);
        
        // Check if the response is an array
        if (Array.isArray(data)) {
          setLessons(data);
          setError(null);
        } else if (data.error) {
          // Handle error response
          setError(data.error);
          setLessons([]);
        } else {
          // Unexpected response format
          setError("Unexpected response format from server");
          setLessons([]);
        }
      } catch (error) {
        console.error("Error fetching lessons:", error);
        setError("Failed to fetch lessons: " + (error as Error).message);
        setLessons([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLessons();
    
    // Set up polling to update lessons status
    const interval = setInterval(fetchLessons, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    if (!lessonOutline.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Call our API to generate the lesson
      const response = await fetch("/api/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ outline: lessonOutline }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Redirect to the lesson page
        router.push(`/lessons/${data.id}`);
      } else {
        setError(data.error || "Failed to generate lesson");
      }
    } catch (error) {
      console.error("Error generating lesson:", error);
      setError("Error generating lesson: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const viewLesson = (id: string) => {
    router.push(`/lessons/${id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "generating":
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Generating</span>;
      case "generated":
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Generated</span>;
      case "failed":
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Failed</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Unknown</span>;
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 text-center">Lesson Generator</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6">
            <label htmlFor="lessonOutline" className="block text-sm font-medium mb-2">
              Lesson Outline
            </label>
            <textarea
              id="lessonOutline"
              value={lessonOutline}
              onChange={(e) => setLessonOutline(e.target.value)}
              placeholder="Enter a lesson outline, e.g. 'A 10 question pop quiz on Florida'"
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !lessonOutline.trim()}
            className={`w-full py-3 px-4 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isGenerating || !lessonOutline.trim()
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
            }`}
          >
            {isGenerating ? "Generating..." : "Generate Lesson"}
          </button>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Your Lessons</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Loading lessons...
                    </td>
                  </tr>
                ) : lessons.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No lessons generated yet. Create your first lesson above!
                    </td>
                  </tr>
                ) : (
                  lessons.map((lesson) => (
                    <tr key={lesson.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {lesson.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(lesson.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => viewLesson(lesson.id)}
                          disabled={lesson.status !== "generated"}
                          className={`px-3 py-1 rounded text-sm ${
                            lesson.status === "generated"
                              ? "bg-blue-600 hover:bg-blue-700 text-white"
                              : "bg-gray-200 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}