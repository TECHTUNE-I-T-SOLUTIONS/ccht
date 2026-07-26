import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

// Simple CSV parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

// Clean option text by removing prefixes like "A:", "B:", etc. and curly braces
function cleanOptionText(text: string): string {
  if (!text) return ''
  let cleaned = text.trim()
  
  // Remove brackets/braces FIRST (before trying to remove prefixes)
  cleaned = cleaned.replace(/[{}\[\]]/g, '')
  
  // Remove any single letter followed by separator and optional space at the start
  // This handles: A:, A. , A) , B:, B. , B), etc.
  cleaned = cleaned.replace(/^[A-Za-z][.:)]\s*/, '')
  
  // Remove any number followed by separator and optional space at the start
  // This handles: 1:, 1. , 1) , 2:, etc.
  cleaned = cleaned.replace(/^\d+[.:)]\s*/, '')
  
  // Trim whitespace
  return cleaned.trim()
}

async function parseCSV(text: string): Promise<any[]> {
  const lines = text.split('\n').filter(line => line.trim())
  
  if (lines.length < 2) {
    throw new Error('File must have at least a header and one data row')
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())
  const questions: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const question: any = {
      question_number: i,
      is_active: true,
      options: [],
    }

    headers.forEach((header, index) => {
      const value = values[index] || ''
      
      // More specific header matching
      if (header === 'question_text' || header === 'question' || header === 'text') {
        question.question_text = value
      } else if (header === 'question_type' || header === 'type') {
        question.question_type = value || 'multiple_choice'
      } else if (header === 'options') {
        // Handle comma-separated options in a single cell
        if (value) {
          question.options = value.split(',').map((opt: string) => cleanOptionText(opt)).filter((opt: string) => opt)
        }
      } else if (header.startsWith('option')) {
        // Handle separate option columns (option1, option2, etc.)
        if (!question.options) question.options = []
        if (value) {
          question.options.push(cleanOptionText(value))
        }
      } else if (header === 'correct_answer' || header === 'correct' || header === 'answer') {
        question.correct_answer = cleanOptionText(value)
      } else if (header === 'marks' || header === 'mark' || header === 'points' || header === 'point') {
        question.marks = parseInt(value) || 1
      } else if (header === 'question_number' || header === 'number' || header === 'order') {
        question.question_number = parseInt(value) || i
      } else if (header === 'explanation') {
        question.explanation = value
      }
    })

    // Ensure options is an array
    if (!question.options) {
      question.options = []
    }

    // Try to match correct answer to one of the options (for multiple choice)
    if (question.question_type === 'multiple_choice' && question.correct_answer && question.options.length > 0) {
      const cleanedAnswer = cleanOptionText(question.correct_answer)
      // console.log('Matching correct answer:', question.correct_answer, 'cleaned:', cleanedAnswer, 'to options:', question.options)
      
      // Check if the cleaned answer matches any option exactly
      const matchingOption = question.options.find((opt: string) => opt === cleanedAnswer)
      if (matchingOption) {
        question.correct_answer = matchingOption
        console.log('Found exact match:', matchingOption)
      } else {
        // If not found, try to match with original answer
        const originalMatch = question.options.find((opt: string) => opt === question.correct_answer)
        if (originalMatch) {
          question.correct_answer = originalMatch
          console.log('Found original match:', originalMatch)
        } else {
          // Try to match by letter index (A=0, B=1, C=2, D=3)
          const letterMatch = question.correct_answer.match(/^[A-Da-d]$/)
          if (letterMatch) {
            const index = question.correct_answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
            if (index >= 0 && index < question.options.length && question.options[index]) {
              question.correct_answer = question.options[index]
              // console.log('Found letter index match:', question.correct_answer, 'at index', index)
            }
          } else {
            // Try partial match (if correct answer is substring of an option)
            const partialMatch = question.options.find((opt: string) => 
              opt.toLowerCase().includes(cleanedAnswer.toLowerCase()) || 
              cleanedAnswer.toLowerCase().includes(opt.toLowerCase())
            )
            if (partialMatch) {
              question.correct_answer = partialMatch
              console.log('Found partial match:', partialMatch)
            }
          }
        }
      }
    }

    // Only add if we have at least a question text
    if (question.question_text) {
      questions.push(question)
    }
  }

  return questions
}

async function parseExcel(buffer: Buffer): Promise<any[]> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
  
  if (jsonData.length < 2) {
    throw new Error('File must have at least a header and one data row')
  }

  const headers = jsonData[0].map((h: any) => String(h || '').trim().toLowerCase())
  const questions: any[] = []

  for (let i = 1; i < jsonData.length; i++) {
    const values = jsonData[i] || []
    const question: any = {
      question_number: i,
      is_active: true,
      options: [],
    }

    headers.forEach((header: string, index: number) => {
      const value = values[index] !== undefined ? String(values[index]).trim() : ''
      
      // More specific header matching
      if (header === 'question_text' || header === 'question' || header === 'text') {
        question.question_text = value
      } else if (header === 'question_type' || header === 'type') {
        question.question_type = value || 'multiple_choice'
      } else if (header === 'options') {
        // Handle comma-separated options in a single cell
        if (value) {
          question.options = value.split(',').map((opt: string) => cleanOptionText(opt)).filter((opt: string) => opt)
        }
      } else if (header.startsWith('option')) {
        // Handle separate option columns (option1, option2, etc.)
        if (!question.options) question.options = []
        if (value) {
          question.options.push(cleanOptionText(value))
        }
      } else if (header === 'correct_answer' || header === 'correct' || header === 'answer') {
        question.correct_answer = cleanOptionText(value)
      } else if (header === 'marks' || header === 'mark' || header === 'points' || header === 'point') {
        question.marks = parseInt(value) || 1
      } else if (header === 'question_number' || header === 'number' || header === 'order') {
        question.question_number = parseInt(value) || i
      } else if (header === 'explanation') {
        question.explanation = value
      }
    })

    // Ensure options is an array
    if (!question.options) {
      question.options = []
    }

    // Try to match correct answer to one of the options (for multiple choice)
    if (question.question_type === 'multiple_choice' && question.correct_answer && question.options.length > 0) {
      const cleanedAnswer = cleanOptionText(question.correct_answer)
      // console.log('Matching correct answer:', question.correct_answer, 'cleaned:', cleanedAnswer, 'to options:', question.options)
      
      // Check if the cleaned answer matches any option exactly
      const matchingOption = question.options.find((opt: string) => opt === cleanedAnswer)
      if (matchingOption) {
        question.correct_answer = matchingOption
        console.log('Found exact match:', matchingOption)
      } else {
        // If not found, try to match with original answer
        const originalMatch = question.options.find((opt: string) => opt === question.correct_answer)
        if (originalMatch) {
          question.correct_answer = originalMatch
          console.log('Found original match:', originalMatch)
        } else {
          // Try to match by letter index (A=0, B=1, C=2, D=3)
          const letterMatch = question.correct_answer.match(/^[A-Da-d]$/)
          if (letterMatch) {
            const index = question.correct_answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
            if (index >= 0 && index < question.options.length && question.options[index]) {
              question.correct_answer = question.options[index]
              // console.log('Found letter index match:', question.correct_answer, 'at index', index)
            }
          } else {
            // Try partial match (if correct answer is substring of an option)
            const partialMatch = question.options.find((opt: string) => 
              opt.toLowerCase().includes(cleanedAnswer.toLowerCase()) || 
              cleanedAnswer.toLowerCase().includes(opt.toLowerCase())
            )
            if (partialMatch) {
              question.correct_answer = partialMatch
              // console.log('Found partial match:', partialMatch)
            }
          }
        }
      }
    }

    // Only add if we have at least a question text
    if (question.question_text) {
      questions.push(question)
    }
  }

  return questions
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let questions: any[]

    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      questions = await parseExcel(buffer)
    } else {
      // Assume CSV
      const text = buffer.toString('utf-8')
      questions = await parseCSV(text)
    }

    return NextResponse.json({ data: questions, count: questions.length })
  } catch (error: any) {
    console.error('Parse error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to parse questions' }, { status: 500 })
  }
}
