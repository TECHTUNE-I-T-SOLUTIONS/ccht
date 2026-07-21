import { jsPDF } from 'jspdf'

export interface StudentResultData {
  firstName: string
  lastName: string
  matricNumber: string
  program: string
  department: string
  session: string
  semester: string
  level: string
  results: {
    courseCode: string
    courseTitle: string
    credit: number
    score: number
    grade: string
    gradePoint: number
  }[]
  totalCredits: number
  totalGradePoints: number
  gpa: number
  cgpa: number
  generatedDate: string
}

export function generateStudentResults(data: StudentResultData): jsPDF {
  const {
    firstName,
    lastName,
    matricNumber,
    program,
    department,
    session,
    semester,
    level,
    results,
    totalCredits,
    totalGradePoints,
    gpa,
    cgpa,
    generatedDate
  } = data

  const doc = new jsPDF()
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  const lineHeight = 5
  let y = margin

  const addPageIfNeeded = (additionalSpace = 20) => {
    if (y + additionalSpace > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Add school logo
  try {
    doc.addImage('/images/logo.png', 'PNG', margin, y, 30, 30)
    y += 35
  } catch (error) {
    // If logo fails to load, continue without it
    console.warn('Failed to load logo:', error)
  }

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', 105, y, { align: 'center' })
  y += 10
  doc.setFontSize(14)
  doc.text('OFFICIAL STUDENT RESULTS', 105, y, { align: 'center' })
  y += 15

  // Student Information
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT INFORMATION:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`- Name: ${firstName} ${lastName}`, 25, y)
  y += 5
  doc.text(`- Matric Number: ${matricNumber}`, 25, y)
  y += 5
  doc.text(`- Program: ${program}`, 25, y)
  y += 5
  doc.text(`- Department: ${department}`, 25, y)
  y += 5
  doc.text(`- Level: ${level}L`, 25, y)
  y += 10

  // Academic Session
  doc.setFont('helvetica', 'bold')
  doc.text('ACADEMIC SESSION:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`- Session: ${session}`, 25, y)
  y += 5
  doc.text(`- Semester: ${semester}`, 25, y)
  y += 10

  // Results Table Header
  addPageIfNeeded(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('COURSE RESULTS:', 20, y)
  y += 10

  // Table headers
  const colWidths = [25, 60, 15, 15, 15, 20]
  const headers = ['Code', 'Course Title', 'Credit', 'Score', 'Grade', 'GP']
  let xPos = 20

  headers.forEach((header, index) => {
    doc.text(header, xPos, y)
    xPos += colWidths[index]
  })
  y += 7

  // Draw line under headers
  doc.setLineWidth(0.1)
  doc.line(20, y - 2, 20 + colWidths.reduce((a, b) => a + b, 0), y - 2)
  y += 5

  // Table rows
  doc.setFont('helvetica', 'normal')
  results.forEach((result) => {
    addPageIfNeeded(10)
    xPos = 20
    doc.text(result.courseCode, xPos, y)
    xPos += colWidths[0]
    
    const title = result.courseTitle.length > 25 ? result.courseTitle.substring(0, 25) + '...' : result.courseTitle
    doc.text(title, xPos, y)
    xPos += colWidths[1]
    
    doc.text(result.credit.toString(), xPos, y)
    xPos += colWidths[2]
    
    doc.text(result.score.toString(), xPos, y)
    xPos += colWidths[3]
    
    doc.text(result.grade, xPos, y)
    xPos += colWidths[4]
    
    doc.text(result.gradePoint.toString(), xPos, y)
    y += 7
  })

  // Summary
  y += 10
  addPageIfNeeded(30)
  doc.setFont('helvetica', 'bold')
  doc.text('SUMMARY:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
 doc.text(`- Total Credits: ${totalCredits}`, 25, y)
  y += 5
  doc.text(`- Total Grade Points: ${totalGradePoints}`, 25, y)
  y += 5
  doc.text(`- Semester GPA: ${gpa.toFixed(2)}`, 25, y)
  y += 5
  doc.text(`- Cumulative GPA: ${cgpa.toFixed(2)}`, 25, y)
  y += 10

  // Grading System
  addPageIfNeeded(40)
  doc.setFont('helvetica', 'bold')
  doc.text('GRADING SYSTEM:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const grading = [
    'A (70-100): 5.0 GP',
    'B (60-69): 4.0 GP',
    'C (50-59): 3.0 GP',
    'D (45-49): 2.0 GP',
    'E (40-44): 1.0 GP',
    'F (0-39): 0.0 GP'
  ]
  grading.forEach(grade => {
    doc.text(grade, 25, y)
    y += 4
  })
  y += 10

  // Footer
  addPageIfNeeded(20)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('This document is official and confidential. Any unauthorized reproduction or distribution is prohibited.', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY - Excellence in Health Education', 20, y)
  y += 10
  doc.text(`Generated on: ${generatedDate}`, 20, y)

  return doc
}
