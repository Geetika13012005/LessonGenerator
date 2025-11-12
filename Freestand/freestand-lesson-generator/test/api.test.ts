// Simple test to verify API endpoints work correctly
// This is not a full test suite but a basic verification

// Mock lesson data
const testLessonOutline = "A simple introduction to TypeScript variables";

async function testApiEndpoints() {
  console.log("Testing API endpoints...");
  
  try {
    // Test creating a lesson
    console.log("1. Testing lesson creation...");
    
    const response = await fetch('http://localhost:3000/api/lessons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ outline: testLessonOutline }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create lesson: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("   Lesson created with ID:", data.id);
    
    // Test fetching lessons
    console.log("2. Testing lessons fetching...");
    
    const lessonsResponse = await fetch('http://localhost:3000/api/lessons');
    
    if (!lessonsResponse.ok) {
      throw new Error(`Failed to fetch lessons: ${lessonsResponse.status} ${lessonsResponse.statusText}`);
    }
    
    const lessons = await lessonsResponse.json();
    console.log("   Fetched", lessons.length, "lessons");
    
    // Test fetching a specific lesson
    console.log("3. Testing specific lesson fetching...");
    
    const lessonResponse = await fetch(`http://localhost:3000/api/lessons/${data.id}`);
    
    if (!lessonResponse.ok) {
      throw new Error(`Failed to fetch lesson: ${lessonResponse.status} ${lessonResponse.statusText}`);
    }
    
    const lesson = await lessonResponse.json();
    console.log("   Fetched lesson:", lesson.title);
    
    console.log("All API tests passed!");
  } catch (error) {
    console.error("API test failed:", error);
  }
}

// Run the test
testApiEndpoints();