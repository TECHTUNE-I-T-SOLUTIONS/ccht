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
      } else if (header === 'question_type' || header === 'type' || header === 'question type') {
        // Normalize question type to lowercase with underscores
        const trimmedValue = value.trim()
        const normalizedType = trimmedValue.toLowerCase().replace(/\//g, '_').replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
        
        // Use normalized type, but also check for keyword matches as fallback
        let questionType = normalizedType || 'multiple_choice'
        
        // Fallback: check for keywords if normalization didn't work
        const lowerValue = trimmedValue.toLowerCase()
        if (lowerValue.includes('fill') && lowerValue.includes('blank')) {
          questionType = 'fill_in_the_blank'
        } else if (lowerValue.includes('short') && lowerValue.includes('answer')) {
          questionType = 'short_answer'
        } else if (lowerValue.includes('essay')) {
          questionType = 'essay'
        } else if (lowerValue.includes('true') && lowerValue.includes('false')) {
          questionType = 'true_false'
        } else if (lowerValue.includes('multiple') || lowerValue.includes('choice')) {
          questionType = 'multiple_choice'
        }
        
        question.question_type = questionType
        console.log(`Question ${i} type: raw="${trimmedValue}" (len=${trimmedValue.length}) -> normalized="${questionType}"`) // Debug log
      } else if (header === 'options') {
        // Handle comma-separated options in a single cell
        if (value) {
          question.options = value.split(',').map((opt: string) => cleanOptionText(opt)).filter((opt: string) => opt)
        }
      } else if (header.startsWith('option')) {
        // Handle any option columns (Option A, Option B, option_a, option1, etc.)
        if (!question.options) question.options = []
        if (value) {
          question.options.push(cleanOptionText(value))
        }
      } else if (header === 'correct_answer' || header === 'correct' || header === 'answer' || header === 'correct answer') {
        question.correct_answer = cleanOptionText(value)
        console.log(`Question ${i} - Found correct answer: "${question.correct_answer}"`) // Debug log
      } else if (header === 'marks' || header === 'mark' || header === 'points' || header === 'point') {
        question.marks = parseInt(value) || 1
      } else if (header === 'question_number' || header === 'number' || header === 'order' || header === 'no') {
        question.question_number = parseInt(value) || i
      } else if (header === 'explanation') {
        question.explanation = value
      }
    })

    // Ensure options is an array
    if (!question.options) {
      question.options = []
    }

    // Process correct answer for all question types
    console.log(`Question ${i} - Type: "${question.question_type}", Correct Answer: "${question.correct_answer}", Options:`, question.options)
    
    if (question.correct_answer) {
      // For multiple choice, try to match the correct answer to one of the options
      if (question.question_type === 'multiple_choice' && question.options.length > 0) {
        const cleanedAnswer = cleanOptionText(question.correct_answer)
        console.log(`Question ${i} - Matching correct answer: "${cleanedAnswer}"`)
        
        // Check if the cleaned answer matches any option exactly
        const matchingOption = question.options.find((opt: string) => opt === cleanedAnswer)
        if (matchingOption) {
          question.correct_answer = matchingOption
          console.log(`Question ${i} - Matched by exact text: "${matchingOption}"`)
        } else {
          // If not found, try to match with original answer
          const originalMatch = question.options.find((opt: string) => opt === question.correct_answer)
          if (originalMatch) {
            question.correct_answer = originalMatch
            console.log(`Question ${i} - Matched by original text: "${originalMatch}"`)
          } else {
            // Try to match by letter index (A=0, B=1, C=2, D=3)
            const letterMatch = question.correct_answer.match(/^[A-Da-d]$/)
            if (letterMatch) {
              const index = question.correct_answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
              if (index >= 0 && index < question.options.length && question.options[index]) {
                question.correct_answer = question.options[index]
                console.log(`Question ${i} - Matched by letter index ${index}: "${question.options[index]}"`)
              }
            } else {
              // Try partial match (if correct answer is substring of an option)
              const partialMatch = question.options.find((opt: string) => 
                opt.toLowerCase().includes(cleanedAnswer.toLowerCase()) || 
                cleanedAnswer.toLowerCase().includes(opt.toLowerCase())
              )
              if (partialMatch) {
                question.correct_answer = partialMatch
                console.log(`Question ${i} - Matched by partial text: "${partialMatch}"`)
              } else {
                console.log(`Question ${i} - No match found for correct answer: "${cleanedAnswer}"`)
              }
            }
          }
        }
      } else if (question.question_type === 'true_false') {
        // Normalize true/false answers to lowercase
        const normalizedAnswer = question.correct_answer.toLowerCase().trim()
        if (normalizedAnswer === 'true' || normalizedAnswer === 'false' || normalizedAnswer === 't' || normalizedAnswer === 'f') {
          question.correct_answer = normalizedAnswer === 't' ? 'true' : normalizedAnswer === 'f' ? 'false' : normalizedAnswer
          console.log(`Question ${i} - Normalized true/false answer: "${question.correct_answer}"`)
        }
      } else {
        // For fill_blank, short_answer, essay - keep the correct answer as-is
        console.log(`Question ${i} - Keeping correct answer as-is for ${question.question_type}: "${question.correct_answer}"`)
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

  console.log('Excel headers:', headers) // Debug log

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
      } else if (header === 'question_type' || header === 'type' || header === 'question type') {
        // Normalize question type to lowercase with underscores
        const trimmedValue = value.trim()
        const normalizedType = trimmedValue.toLowerCase().replace(/\//g, '_').replace(/\s+/g, '_').replace(/[^a-z_]/g, '')
        
        // Use normalized type, but also check for keyword matches as fallback
        let questionType = normalizedType || 'multiple_choice'
        
        // Fallback: check for keywords if normalization didn't work
        const lowerValue = trimmedValue.toLowerCase()
        if (lowerValue.includes('fill') && lowerValue.includes('blank')) {
          questionType = 'fill_in_the_blank'
        } else if (lowerValue.includes('short') && lowerValue.includes('answer')) {
          questionType = 'short_answer'
        } else if (lowerValue.includes('essay')) {
          questionType = 'essay'
        } else if (lowerValue.includes('true') && lowerValue.includes('false')) {
          questionType = 'true_false'
        } else if (lowerValue.includes('multiple') || lowerValue.includes('choice')) {
          questionType = 'multiple_choice'
        }
        
        question.question_type = questionType
        console.log(`Question ${i} type: raw="${trimmedValue}" (len=${trimmedValue.length}) -> normalized="${questionType}"`) // Debug log
      } else if (header === 'options') {
        // Handle comma-separated options in a single cell
        if (value) {
          question.options = value.split(',').map((opt: string) => cleanOptionText(opt)).filter((opt: string) => opt)
        }
      } else if (header.startsWith('option')) {
        // Handle any option columns (Option A, Option B, option_a, option1, etc.)
        console.log(`Found option column: ${header} = ${value}`) // Debug log
        if (!question.options) question.options = []
        if (value) {
          question.options.push(cleanOptionText(value))
        }
      } else if (header === 'correct_answer' || header === 'correct' || header === 'answer' || header === 'correct answer') {
        question.correct_answer = cleanOptionText(value)
        console.log(`Question ${i} - Found correct answer: "${question.correct_answer}"`) // Debug log
      } else if (header === 'marks' || header === 'mark' || header === 'points' || header === 'point') {
        question.marks = parseInt(value) || 1
      } else if (header === 'question_number' || header === 'number' || header === 'order') {
        question.question_number = parseInt(value) || i
      } else if (header === 'explanation') {
        question.explanation = value
      }
    })
    
    console.log(`Question ${i} - Final: type="${question.question_type}", correct_answer="${question.correct_answer}", options=`, question.options) // Debug log

    // Ensure options is an array
    if (!question.options) {
      question.options = []
    }

    // Process correct answer for all question types
    if (question.correct_answer) {
      // For multiple choice, try to match the correct answer to one of the options
      if (question.question_type === 'multiple_choice' && question.options.length > 0) {
        const cleanedAnswer = cleanOptionText(question.correct_answer)
        
        // Check if the cleaned answer matches any option exactly
        const matchingOption = question.options.find((opt: string) => opt === cleanedAnswer)
        if (matchingOption) {
          question.correct_answer = matchingOption
        } else {
          // If not found, try to match with original answer
          const originalMatch = question.options.find((opt: string) => opt === question.correct_answer)
          if (originalMatch) {
            question.correct_answer = originalMatch
          } else {
            // Try to match by letter index (A=0, B=1, C=2, D=3)
            const letterMatch = question.correct_answer.match(/^[A-Da-d]$/)
            if (letterMatch) {
              const index = question.correct_answer.toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0)
              if (index >= 0 && index < question.options.length && question.options[index]) {
                question.correct_answer = question.options[index]
              }
            } else {
              // Try partial match (if correct answer is substring of an option)
              const partialMatch = question.options.find((opt: string) => 
                opt.toLowerCase().includes(cleanedAnswer.toLowerCase()) || 
                cleanedAnswer.toLowerCase().includes(opt.toLowerCase())
              )
              if (partialMatch) {
                question.correct_answer = partialMatch
              }
            }
          }
        }
      } else if (question.question_type === 'true_false') {
        // Normalize true/false answers to lowercase
        const normalizedAnswer = question.correct_answer.toLowerCase().trim()
        if (normalizedAnswer === 'true' || normalizedAnswer === 'false' || normalizedAnswer === 't' || normalizedAnswer === 'f') {
          question.correct_answer = normalizedAnswer === 't' ? 'true' : normalizedAnswer === 'f' ? 'false' : normalizedAnswer
        }
      } else {
        // For fill_blank, short_answer, essay - keep the correct answer as-is
        console.log(`Question ${i} - Keeping correct answer as-is for ${question.question_type}: "${question.correct_answer}"`)
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