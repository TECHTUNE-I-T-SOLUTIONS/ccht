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
    ca: number
    exam: number
    total: number
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
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  const contentWidth = pageWidth - margin * 2
  let y = margin

  const addPageIfNeeded = (additionalSpace = 20) => {
    if (y + additionalSpace > pageHeight - margin - 15) {
      // Add footer before page break
      addFooter()
      doc.addPage()
      y = margin
      addPageHeader()
    }
  }

  const addFooter = () => {
    const footerY = pageHeight - 12
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100)
    doc.text('This document is official and confidential. Unauthorized reproduction is prohibited.', margin, footerY)
    doc.setFont('helvetica', 'normal')
    doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - margin - 10, footerY)
    doc.setTextColor(0)
  }

  const addPageHeader = () => {
    // Mini header on continuation pages
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(30, 64, 175)
    doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', margin, y)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'normal')
    y += 8
  }

  // ==================== HEADER SECTION ====================
  // School logo - centered at top
  try {
    const logoUrl = 'https://www.covenantcollegeofhealthtech.com.ng/_next/image?url=%2Fimages%2Flogo.png&w=48&q=75'
    doc.addImage(logoUrl, 'PNG', pageWidth / 2 - 12, y, 24, 24)
    y += 28
  } catch (error) {
    console.warn('Failed to load logo:', error)
  }

  // School name
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 6

  // Subtitle
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  doc.text('Igbon, Oyo State, Nigeria', pageWidth / 2, y, { align: 'center' })
  y += 4
  doc.text('Email: info@covenantcollegeofhealthtech.com.ng | Phone: +2347066369818', pageWidth / 2, y, { align: 'center' })
  y += 8

  // Title bar
  doc.setFillColor(30, 64, 175)
  doc.rect(margin, y, contentWidth, 8, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('OFFICIAL STUDENT RESULTS TRANSCRIPT', pageWidth / 2, y + 5.5, { align: 'center' })
  doc.setTextColor(0)
  y += 14

  // ==================== STUDENT INFO SECTION ====================
  doc.setFillColor(240, 245, 255)
  doc.rect(margin, y, contentWidth, 28, 'F')
  doc.setDrawColor(30, 64, 175)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentWidth, 28, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('STUDENT INFORMATION', margin + 3, y + 5)
  doc.setTextColor(0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  const col1X = margin + 3
  const col2X = pageWidth / 2 + 3
  const rowH = 5

  doc.text(`Name: ${firstName} ${lastName}`, col1X, y + 11)
  doc.text(`Matric No: ${matricNumber}`, col1X, y + 16)
  doc.text(`Program: ${program}`, col1X, y + 21)

  doc.text(`Department: ${department || 'N/A'}`, col2X, y + 11)
  doc.text(`Level: ${level}L`, col2X, y + 16)
  doc.text(`Session: ${session}`, col2X, y + 21)

  y += 32

  // ==================== ACADEMIC SESSION INFO ====================
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text(`ACADEMIC SESSION: ${session} - ${semester}`, margin, y)
  doc.setTextColor(0)
  y += 6

  // ==================== RESULTS TABLE ====================
  addPageIfNeeded(40)

  // Table configuration
  const tableX = margin
  const tableW = contentWidth
  // Column widths (proportional)
  const colW = {
    sn: tableW * 0.04,      // 4% - S/N
    code: tableW * 0.09,    // 9% - Code
    title: tableW * 0.28,  // 28% - Title
    credit: tableW * 0.06, // 6% - Credit
    ca: tableW * 0.08,      // 8% - CA
    exam: tableW * 0.08,    // 8% - Exam
    total: tableW * 0.08,   // 8% - Total
    grade: tableW * 0.07,  // 7% - Grade
    gp: tableW * 0.07,     // 7% - GP
    remark: tableW * 0.15  // 15% - Remark
  }

  // Table header
  doc.setFillColor(30, 64, 175)
  doc.rect(tableX, y, tableW, 7, 'F')
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)

  let xPos = tableX + 1
  doc.text('S/N', xPos, y + 5)
  xPos += colW.sn
  doc.text('CODE', xPos, y + 5)
  xPos += colW.code
  doc.text('COURSE TITLE', xPos, y + 5)
  xPos += colW.title
  doc.text('UNIT', xPos, y + 5)
  xPos += colW.credit
  doc.text('CA', xPos, y + 5)
  xPos += colW.ca
  doc.text('EXAM', xPos, y + 5)
  xPos += colW.exam
  doc.text('TOTAL', xPos, y + 5)
  xPos += colW.total
  doc.text('GRADE', xPos, y + 5)
  xPos += colW.grade
  doc.text('GP', xPos, y + 5)
  xPos += colW.gp
  doc.text('REMARK', xPos, y + 5)

  doc.setTextColor(0)
  y += 7

  // Table rows
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)

  results.forEach((result, index) => {
    addPageIfNeeded(8)

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(tableX, y, tableW, 6, 'F')
    }

    // Row border
    doc.setDrawColor(220, 220, 220)
    doc.setLineWidth(0.1)
    doc.line(tableX, y, tableX + tableW, y)

    xPos = tableX + 1
    doc.text((index + 1).toString(), xPos, y + 4)
    xPos += colW.sn
    doc.text(result.courseCode, xPos, y + 4)
    xPos += colW.code

    // Truncate title if too long
    const maxTitleLen = 30
    const title = result.courseTitle.length > maxTitleLen
      ? result.courseTitle.substring(0, maxTitleLen) + '...'
      : result.courseTitle
    doc.text(title, xPos, y + 4)
    xPos += colW.title

    doc.text(result.credit.toString(), xPos, y + 4)
    xPos += colW.credit

    doc.text((result.ca ?? 0).toFixed(1), xPos, y + 4)
    xPos += colW.ca

    doc.text((result.exam ?? 0).toFixed(1), xPos, y + 4)
    xPos += colW.exam

    doc.text((result.total ?? 0).toFixed(1), xPos, y + 4)
    xPos += colW.total

    doc.text(result.grade, xPos, y + 4)
    xPos += colW.grade

    doc.text(result.gradePoint.toString(), xPos, y + 4)
    xPos += colW.gp

    // Remark based on grade
    let remark = ''
    if (result.grade === 'A') remark = 'Excellent'
    else if (result.grade === 'B') remark = 'Very Good'
    else if (result.grade === 'C') remark = 'Good'
    else if (result.grade === 'D') remark = 'Fair'
    else if (result.grade === 'E') remark = 'Pass'
    else if (result.grade === 'F') remark = 'Fail'
    doc.text(remark, xPos, y + 4)

    y += 6
  })

  // Bottom border of table
  doc.setDrawColor(30, 64, 175)
  doc.setLineWidth(0.3)
  doc.line(tableX, y, tableX + tableW, y)
  y += 8

  // ==================== SUMMARY SECTION ====================
  addPageIfNeeded(30)

  doc.setFillColor(240, 245, 255)
  doc.rect(margin, y, contentWidth, 22, 'F')
  doc.setDrawColor(30, 64, 175)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentWidth, 22, 'S')

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('SUMMARY', margin + 3, y + 5)
  doc.setTextColor(0)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)

  const summaryCol1 = margin + 3
  const summaryCol2 = pageWidth / 2 + 3

  doc.text(`Total Courses: ${results.length}`, summaryCol1, y + 11)
  doc.text(`Total Credits: ${totalCredits}`, summaryCol1, y + 16)
  doc.text(`Total Grade Points: ${totalGradePoints}`, summaryCol2, y + 11)

  // GPA box
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(30, 64, 175)
  doc.text(`Semester GPA: ${gpa.toFixed(2)}`, summaryCol2, y + 16)
  doc.setTextColor(0)

  y += 26

  // CGPA highlight
  addPageIfNeeded(15)
  doc.setFillColor(30, 64, 175)
  doc.rect(margin, y, contentWidth, 10, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`CUMULATIVE GPA (CGPA): ${cgpa.toFixed(2)}`, pageWidth / 2, y + 7, { align: 'center' })
  doc.setTextColor(0)
  y += 16

  // ==================== GRADING SYSTEM ====================
  addPageIfNeeded(25)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 64, 175)
  doc.text('GRADING SYSTEM', margin, y)
  doc.setTextColor(0)
  y += 5

  // Grading table
  const gradeData = [
    { grade: 'A', range: '70 - 100', gp: '5.0', remark: 'Excellent' },
    { grade: 'B', range: '60 - 69', gp: '4.0', remark: 'Very Good' },
    { grade: 'C', range: '50 - 59', gp: '3.0', remark: 'Good' },
    { grade: 'D', range: '45 - 49', gp: '2.0', remark: 'Fair' },
    { grade: 'E', range: '40 - 44', gp: '1.0', remark: 'Pass' },
    { grade: 'F', range: '0 - 39', gp: '0.0', remark: 'Fail' }
  ]

  const gradeColW = {
    grade: contentWidth * 0.15,
    range: contentWidth * 0.25,
    gp: contentWidth * 0.15,
    remark: contentWidth * 0.45
  }

  // Grade table header
  doc.setFillColor(200, 210, 220)
  doc.rect(margin, y, contentWidth, 5, 'F')
  doc.setFontSize(6)
  doc.setFont('helvetica', 'bold')
  xPos = margin + 1
  doc.text('GRADE', xPos, y + 3.5)
  xPos += gradeColW.grade
  doc.text('SCORE RANGE', xPos, y + 3.5)
  xPos += gradeColW.range
  doc.text('GRADE POINT', xPos, y + 3.5)
  xPos += gradeColW.gp
  doc.text('REMARK', xPos, y + 3.5)
  y += 5

  doc.setFont('helvetica', 'normal')
  gradeData.forEach((g, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(248, 250, 252)
      doc.rect(margin, y, contentWidth, 4, 'F')
    }
    xPos = margin + 1
    doc.text(g.grade, xPos, y + 3)
    xPos += gradeColW.grade
    doc.text(g.range, xPos, y + 3)
    xPos += gradeColW.range
    doc.text(g.gp, xPos, y + 3)
    xPos += gradeColW.gp
    doc.text(g.remark, xPos, y + 3)
    y += 4
  })

  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.1)
  doc.line(margin, y, margin + contentWidth, y)
  y += 10

  // ==================== SIGNATURE SECTION ====================
  addPageIfNeeded(25)

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100)
  
  const sigY = y + 15
  // Left signature
  doc.setDrawColor(100)
  doc.setLineWidth(0.3)
  doc.line(margin + 5, sigY, margin + 60, sigY)
  doc.text('Academic Officer', margin + 20, sigY + 4)
  doc.text('Signature & Date', margin + 20, sigY + 7)

  // Right signature
  doc.line(pageWidth - margin - 60, sigY, pageWidth - margin - 5, sigY)
  doc.text('Registrar', pageWidth - margin - 40, sigY + 4)
  doc.text('Signature & Date', pageWidth - margin - 40, sigY + 7)

  doc.setTextColor(0)
  y = sigY + 15

  // ==================== FOOTER ====================
  addFooter()

  return doc
}