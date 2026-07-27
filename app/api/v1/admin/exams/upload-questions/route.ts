import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const examId = formData.get('examId') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!examId) {
      return NextResponse.json({ error: 'Exam ID is required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/plain',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload PDF, Word, Excel, PowerPoint, or plain text files.' 
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be less than 10MB' }, { status: 400 })
    }

    // Read file content
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Parse questions based on file type
    let questions: any[] = []

    if (file.type === 'text/plain') {
      questions = parseTextQuestions(buffer.toString('utf-8'))
    } else if (file.type === 'application/pdf') {
      // For PDF, we'll need a PDF parser library
      // For now, return a message indicating PDF parsing requires additional setup
      return NextResponse.json({ 
        error: 'PDF parsing requires additional setup. Please use plain text, Word, or Excel files for now.' 
      }, { status: 400 })
    } else if (file.type.includes('word') || file.type.includes('spreadsheet') || file.type.includes('excel') || file.type.includes('powerpoint')) {
      // For Office files, we'll need a parser library
      return NextResponse.json({ 
        error: 'Office file parsing requires additional setup. Please use plain text files for now.' 
      }, { status: 400 })
    }

    // Insert parsed questions into database
    const admin = createAdminClient()
    const insertedQuestions = []

    for (const question of questions) {
      const { data, error } = await admin
        .from('student_exam_questions')
        .insert({
          exam_session_id: examId,
          question_text: question.question_text,
          question_type: question.question_type || 'multiple_choice',
          question_number: question.question_number,
          marks: question.marks || 1,
          options: question.options || [],
          correct_answer: question.correct_answer || '',
          explanation: question.explanation || '',
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting question:', error)
        continue
      }

      insertedQuestions.push(data)
    }

    return NextResponse.json({
      success: true,
      data: {
        total: questions.length,
        inserted: insertedQuestions.length,
        questions: insertedQuestions
      },
      message: `Successfully imported ${insertedQuestions.length} questions`
    })
  } catch (error: any) {
    console.error('[admin/upload-questions] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to upload questions' },
      { status: 500 }
    )
  }
}

function parseTextQuestions(text: string): any[] {
  const questions: any[] = []
  const lines = text.split('\n').filter(line => line.trim())
  
  let currentQuestion: any = null
  let questionNumber = 1

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Detect question start (numbered format)
    const questionMatch = trimmedLine.match(/^(\d+)[.)\s]+(.+)/)
    if (questionMatch) {
      // Save previous question if exists
      if (currentQuestion && currentQuestion.question_text) {
        questions.push(currentQuestion)
        questionNumber++
      }

      currentQuestion = {
        question_number: questionNumber,
        question_text: questionMatch[2],
        question_type: 'multiple_choice',
        options: [],
        correct_answer: '',
        marks: 1,
        explanation: ''
      }
      continue
    }

    // Detect options (A, B, C, D format)
    const optionMatch = trimmedLine.match(/^([A-D])[.)\s]+(.+)/i)
    if (optionMatch && currentQuestion) {
      currentQuestion.options.push(optionMatch[2])
      continue
    }

    // Detect correct answer
    const answerMatch = trimmedLine.match(/^(answer|correct|solution)[:\s]+(.+)/i)
    if (answerMatch && currentQuestion) {
      currentQuestion.correct_answer = answerMatch[2].trim()
      continue
    }

    // Detect explanation
    const explanationMatch = trimmedLine.match(/^(explanation|reason)[:\s]+(.+)/i)
    if (explanationMatch && currentQuestion) {
      currentQuestion.explanation = explanationMatch[2].trim()
      continue
    }

    // Detect points/marks
    const marksMatch = trimmedLine.match(/^(points|marks)[:\s]+(\d+)/i)
    if (marksMatch && currentQuestion) {
      currentQuestion.marks = parseInt(marksMatch[2])
      continue
    }

    // If no current question and line looks like a question, start one
    if (!currentQuestion && trimmedLine.length > 10) {
      currentQuestion = {
        question_number: questionNumber,
        question_text: trimmedLine,
        question_type: 'multiple_choice',
        options: [],
        correct_answer: '',
        marks: 1,
        explanation: ''
      }
    }
  }

  // Don't forget the last question
  if (currentQuestion && currentQuestion.question_text) {
    questions.push(currentQuestion)
  }

  return questions
}
