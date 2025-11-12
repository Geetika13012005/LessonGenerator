import { supabaseAdmin } from '@/lib/supabase/service-role';
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { withTrace, addTraceAttributes } from '@/lib/tracing';

export async function generateLessonContent(lessonId: string, outline: string) {
  return withTrace('generate-lesson-content', async () => {
    addTraceAttributes({ lessonId, outline });
    
    try {
      console.log('Starting lesson generation for lesson ID:', lessonId);
      
      // Check if OPENROUTER_API_KEY is available
      if (!process.env.OPENROUTER_API_KEY) {
        throw new Error('OPENROUTER_API_KEY environment variable is not set. Please check your .env.local file.');
      }
      
      console.log('Initializing OpenRouter model...');
      
      // Initialize OpenRouter components for tracing
      const model = new ChatOpenAI({
        model: "openrouter/auto",
        temperature: 0.7,
        apiKey: process.env.OPENROUTER_API_KEY,
        configuration: {
          baseURL: "https://openrouter.ai/api/v1",
        },
      });
      
      const prompt = ChatPromptTemplate.fromMessages([
        [
          "system",
          "You are a helpful assistant that creates educational lesson content in TypeScript. Generate complete, valid TypeScript code that demonstrates the concept described in the lesson outline. The code should be educational and well-commented."
        ],
        [
          "user",
          "Create a TypeScript lesson based on this outline: '{outline}'. The lesson should be in the form of valid TypeScript code with comments explaining the concepts."
        ]
      ]);
      
      const outputParser = new StringOutputParser();
      
      // Create chain for tracing
      const chain = prompt.pipe(model).pipe(outputParser);
      
      console.log('Sending request to OpenRouter API...');
      
      // Generate TypeScript lesson content using OpenRouter with tracing
      const generatedContent = await chain.invoke({ outline });
      
      console.log('Received response from OpenRouter API. Content length:', generatedContent.length);
      
      addTraceAttributes({ contentLength: generatedContent.length });
      
      // Update the lesson with the generated content
      console.log('Updating lesson in Supabase with generated content...');
      const { error: updateError } = await supabaseAdmin
        .from('lessons')
        .update({
          content: generatedContent,
          status: 'generated',
        })
        .eq('id', lessonId);
        
      if (updateError) {
        console.error('Failed to update lesson in Supabase:', updateError);
        throw new Error(`Failed to update lesson: ${updateError.message}`);
      }
      
      console.log('Successfully updated lesson in Supabase');
      return generatedContent;
    } catch (error) {
      console.error('Error generating lesson content:', error);
      addTraceAttributes({ error: (error as Error).message });
      
      // Update the lesson status to "failed" if generation fails
      console.log('Updating lesson status to failed in Supabase...');
      await supabaseAdmin
        .from('lessons')
        .update({ status: 'failed' })
        .eq('id', lessonId);
        
      throw error;
    }
  });
}