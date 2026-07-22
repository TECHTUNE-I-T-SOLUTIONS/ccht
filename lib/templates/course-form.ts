import jsPDF from 'jspdf'

export async function generateCourseFormPDF(data: {
  student: {
    firstName: string
    lastName: string
    email: string
    phone: string | null
    matricNumber: string | null
    currentLevel: string | null
    admissionSession: string | null
    programTitle: string | null
    departmentName: string | null
  }
  courses: Array<{
    code: string
    title: string
    credits: number
    semester: string
    level: string
    reviewedAt: string | null
  }>
  session: string
  semester: string
}) {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  
  let y = margin + 5

  // Header - School name
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'bold')
  pdf.text('COVENANT COLLEGE OF', pageWidth / 2, y, { align: 'center' })
  y += 5
  pdf.text('HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 8

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')
  pdf.text('OFFICIAL COURSE REGISTRATION FORM', pageWidth / 2, y, { align: 'center' })
  y += 10

  // Draw line separator
  pdf.setDrawColor(200)
  pdf.setLineWidth(0.5)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 8

  // Session and Semester Info Table
  const labelWidth = 40
  const valueWidth = (pageWidth - 2 * margin - 2 * labelWidth) / 2
  const cellHeight = 8

  const sessionData = [
    ['Academic Session:', data.session, 'Semester:', data.semester !== 'all' ? data.semester.charAt(0).toUpperCase() + data.semester.slice(1) + ' Semester' : 'All Semesters']
  ]

  sessionData.forEach((row, rowIndex) => {
    // First pair
    const x1 = margin
    const cellY = y + rowIndex * cellHeight
    
    pdf.setDrawColor(200)
    pdf.setLineWidth(0.3)
    pdf.rect(x1, cellY, labelWidth, cellHeight)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80)
    pdf.text(row[0], x1 + 3, cellY + 5)
    
    pdf.rect(x1 + labelWidth, cellY, valueWidth, cellHeight)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0)
    pdf.text(row[1], x1 + labelWidth + 3, cellY + 5)
    
    // Second pair
    const x2 = x1 + labelWidth + valueWidth
    pdf.rect(x2, cellY, labelWidth, cellHeight)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80)
    pdf.text(row[2], x2 + 3, cellY + 5)
    
    pdf.rect(x2 + labelWidth, cellY, valueWidth, cellHeight)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0)
    pdf.text(row[3], x2 + labelWidth + 3, cellY + 5)
  })

  y += sessionData.length * cellHeight + 10

  // Student Information Table
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('STUDENT INFORMATION', margin, y)
  y += 5

  const studentData = [
    ['Name:', `${data.student.firstName} ${data.student.lastName}`, 'Email:', data.student.email],
    ['Matric No:', data.student.matricNumber || 'N/A', 'Phone:', data.student.phone || 'N/A'],
    ['Program:', data.student.programTitle || 'N/A', 'Department:', data.student.departmentName || 'N/A'],
    ['Current Level:', data.student.currentLevel ? `${data.student.currentLevel}L` : 'N/A', 'Admission Session:', data.student.admissionSession || 'N/A']
  ]

  studentData.forEach((row, rowIndex) => {
    // First pair (left column)
    const x1 = margin
    const cellY = y + rowIndex * cellHeight
    
    if (row[0]) {
      pdf.setDrawColor(200)
      pdf.setLineWidth(0.3)
      pdf.rect(x1, cellY, labelWidth, cellHeight)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(80)
      pdf.text(row[0], x1 + 3, cellY + 5)
    }
    
    if (row[1]) {
      pdf.rect(x1 + labelWidth, cellY, valueWidth, cellHeight)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0)
      pdf.text(row[1], x1 + labelWidth + 3, cellY + 5)
    }
    
    // Second pair (right column)
    const x2 = x1 + labelWidth + valueWidth
    
    if (row[2]) {
      pdf.rect(x2, cellY, labelWidth, cellHeight)
      pdf.setFont('helvetica', 'bold')
      pdf.setTextColor(80)
      pdf.text(row[2], x2 + 3, cellY + 5)
    }
    
    if (row[3]) {
      pdf.rect(x2 + labelWidth, cellY, valueWidth, cellHeight)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(0)
      pdf.text(row[3], x2 + labelWidth + 3, cellY + 5)
    }
  })

  y += studentData.length * cellHeight + 10

  // Group courses by semester
  const coursesBySemester = data.courses.reduce((acc, course) => {
    const semester = course.semester
    if (!acc[semester]) {
      acc[semester] = []
    }
    acc[semester].push(course)
    return acc
  }, {} as Record<string, typeof data.courses>)

  const sortedSemesters = Object.keys(coursesBySemester).sort((a, b) => a.localeCompare(b))

  // Calculate total credits
  const totalCredits = data.courses.reduce((sum, course) => sum + course.credits, 0)

  // Courses Section
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('REGISTERED COURSES', margin, y)
  y += 5

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80)
  pdf.text(`Total Credit Units: ${totalCredits}`, pageWidth - margin, y, { align: 'right' })
  pdf.setTextColor(0)
  y += 8

  // Table configuration
  const tableX = margin
  const tableWidth = pageWidth - 2 * margin
  const colWidths = [12, 22, tableWidth - 100, 18, 25, 23]
  const headers = ['S/N', 'Code', 'Title', 'Credits', 'Level', 'Approved']

  // Render courses by semester
  sortedSemesters.forEach((semester) => {
    const courses = coursesBySemester[semester]
    const semesterCredits = courses.reduce((sum, course) => sum + course.credits, 0)

    // Check if we need a new page
    if (y + 50 > pageHeight - margin) {
      pdf.addPage()
      y = margin
    }

    // Semester header
    pdf.setFillColor(230, 240, 255)
    pdf.rect(tableX, y, tableWidth, 10, 'F')
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 100, 200)
    const semesterTitle = semester.charAt(0).toUpperCase() + semester.slice(1) + ' Semester'
    pdf.text(semesterTitle, tableX + 3, y + 6)
    pdf.setFontSize(8)
    pdf.text(`${semesterCredits} Credit Units`, tableX + tableWidth - 30, y + 6)
    pdf.setTextColor(0)
    y += 12

    // Table header
    pdf.setFillColor(245, 245, 245)
    pdf.rect(tableX, y, tableWidth, 8, 'F')
    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    let currentX = tableX
    headers.forEach((header, index) => {
      pdf.text(header, currentX + 2, y + 5, { maxWidth: colWidths[index] })
      currentX += colWidths[index]
    })
    y += 8

    // Table rows
    pdf.setFont('helvetica', 'normal')
    courses.forEach((course, index) => {
      const row = [
        String(index + 1),
        course.code,
        course.title,
        String(course.credits),
        `${course.level}L`,
        course.reviewedAt ? new Date(course.reviewedAt).toLocaleDateString() : 'N/A',
      ]
      
      currentX = tableX
      row.forEach((cell, cellIndex) => {
        pdf.text(cell, currentX + 2, y + 4, { maxWidth: colWidths[cellIndex] })
        currentX += colWidths[cellIndex]
      })
      
      pdf.setDrawColor(230, 230, 230)
      pdf.line(tableX, y + 5, tableX + tableWidth, y + 5)
      pdf.setDrawColor(0, 0, 0)
      y += 7
    })

    y += 5
  })

  // Summary box
  pdf.setDrawColor(0)
  pdf.setFillColor(245, 250, 255)
  pdf.rect(margin, y, pageWidth - 2 * margin, 12, 'FD')
  y += 8
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`Total Courses: ${data.courses.length}`, margin + 5, y)
  pdf.text(`Total Credit Units: ${totalCredits}`, pageWidth / 2, y, { align: 'center' })
  pdf.setTextColor(0, 120, 50)
  pdf.text('Status: Approved', pageWidth - margin - 5, y, { align: 'right' })
  pdf.setTextColor(0)
  y += 12

  // Footer
  y = pageHeight - 20
  pdf.setDrawColor(200)
  pdf.line(margin, y, pageWidth - margin, y)
  y += 7

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80)
  pdf.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 4
  pdf.setFont('helvetica', 'italic')
  pdf.text('Excellence in Health Education', pageWidth / 2, y, { align: 'center' })
  y += 4
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' })

  return pdf.output('arraybuffer')
}
