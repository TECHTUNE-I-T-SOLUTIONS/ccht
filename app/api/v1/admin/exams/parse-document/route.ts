import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export const runtime = 'nodejs'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-lite-preview-09-2025',
  'gemini-2.5-pro',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
]

async function parseDocumentWithAI(fileBuffer: Buffer, fileName: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
  
  // Try models in order of preference (fastest first)
  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      
      const prompt = `Extract questions from this document. Return a JSON array with this exact structure:
[
  {
    "question_text": "string",
    "question_type": "multiple_choice|true_false|short_answer|essay|fill_blank",
    "options": ["option1", "option2", "option3", "option4"] (only for multiple_choice),
    "correct_answer": "string",
    "marks": number,
    "question_number": number,
    "is_active": true
  }
]

Rules:
- For multiple choice: extract all options and the correct answer
- For true/false: correct_answer should be "true" or "false"
- For fill_blank: extract the blank word/phrase
- For essay/short_answer: provide a model answer
- marks should be a reasonable number (1-20)
- question_number should be sequential starting from 1
- is_active should always be true
- Return ONLY valid JSON, no markdown formatting`

      // For text-based files, convert to text
      let content: string
      if (fileName.endsWith('.pdf') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        // For binary files, we'll need to use the file content directly
        // Gemini can handle PDF and DOC files directly
        const filePart = {
          inlineData: {
            data: fileBuffer.toString('base64'),
            mimeType: fileName.endsWith('.pdf') ? 'application/pdf' : 
                     fileName.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                     'application/msword'
          }
        }
        
        const result = await model.generateContent([prompt, filePart])
        const response = await result.response
        content = response.text()
      } else {
        // For CSV/Excel, convert to text first
        content = fileBuffer.toString('utf-8')
        const result = await model.generateContent(prompt + '\n\nDocument content:\n' + content)
        const response = await result.response
        content = response.text()
      }

      // Clean the response - remove markdown code blocks if present
      const cleanedContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

      // Parse JSON
      const questions = JSON.parse(cleanedContent)
      
      if (!Array.isArray(questions)) {
        throw new Error('AI did not return an array')
      }

      // Validate and normalize questions
      const validQuestionTypes = ['multiple_choice', 'true_false', 'short_answer', 'essay', 'fill_blank']
      
      return questions.map((q: any, index: number) => ({
        question_text: q.question_text || '',
        question_type: validQuestionTypes.includes(q.question_type) ? q.question_type : 'short_answer',
        options: Array.isArray(q.options) ? q.options : [],
        correct_answer: q.correct_answer || '',
        marks: typeof q.marks === 'number' ? q.marks : 10,
        question_number: typeof q.question_number === 'number' ? q.question_number : index + 1,
        is_active: q.is_active !== false,
      }))

    } catch (error: any) {
      console.warn(`Failed with model ${modelName}:`, error.message)
      // Continue to next model
      continue
    }
  }

  throw new Error('All Gemini models failed to parse the document')
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Check file size (limit to 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    const questions = await parseDocumentWithAI(buffer, file.name)
    
    return NextResponse.json({ 
      success: true, 
      data: questions,
      count: questions.length 
    })
  } catch (error: any) {
    console.error('Document parsing error:', error)
    return NextResponse.json({ 
      error: error?.message || 'Failed to parse document with AI' 
    }, { status: 500 })
  }
}