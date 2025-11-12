import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/service-role';
import { generateLessonContent } from '@/lib/ai';

// Check if environment variables are set
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase environment variables check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase environment variables are not set');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/lessons called');
    
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables are not configured properly' },
        { status: 500 }
      );
    }

    const { outline } = await request.json();
    console.log('Received outline:', outline);
    
    if (!outline) {
      return NextResponse.json(
        { error: 'Lesson outline is required' },
        { status: 400 }
      );
    }
    
    // Create a new lesson record with "generating" status
    console.log('Creating lesson record in Supabase...');
    const { data: lesson, error: insertError } = await supabaseAdmin
      .from('lessons')
      .insert({
        title: outline.substring(0, 50) + (outline.length > 50 ? '...' : ''),
        content: '',
        status: 'generating',
      })
      .select()
      .single();
      
    console.log('Supabase insert result:', { data: lesson, error: insertError });
      
    if (insertError) {
      console.error('Error creating lesson record:', insertError);
      return NextResponse.json(
        { error: 'Failed to create lesson record: ' + insertError.message },
        { status: 500 }
      );
    }
    
    console.log('Lesson record created successfully. Starting background generation...');
    
    // Generate the lesson content asynchronously
    generateLessonContent(lesson.id, outline)
      .then(() => {
        console.log('Lesson generation completed successfully for lesson ID:', lesson.id);
      })
      .catch(async (error: any) => {
        console.error('Error in background generation for lesson ID:', lesson.id, error);
        // Update the lesson status to "failed" if generation fails
        try {
          await supabaseAdmin
            .from('lessons')
            .update({ status: 'failed' })
            .eq('id', lesson.id);
          console.log('Updated lesson status to failed for lesson ID:', lesson.id);
        } catch (updateError) {
          console.error('Failed to update lesson status to failed for lesson ID:', lesson.id, updateError);
        }
      });
    
    return NextResponse.json({ id: lesson.id });
  } catch (error) {
    console.error('Error in lesson generation API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('GET /api/lessons called');
    
    // Check if Supabase is properly configured
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase environment variables are not configured properly' },
        { status: 500 }
      );
    }

    console.log('Fetching lessons from Supabase...');
    const { data: lessons, error } = await supabaseAdmin
      .from('lessons')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false });
      
    console.log('Supabase select result:', { data: lessons, error });
      
    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons: ' + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(lessons);
  } catch (error) {
    console.error('Error in lessons API:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}