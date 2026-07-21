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
  
  let y = 20

  // Add school logo
  try {
    pdf.addImage('/images/logo.png', 'PNG', 20, y, 30, 30)
    y += 35
  } catch (error) {
    // If logo fails to load, continue without it
    console.warn('Failed to load logo:', error)
    y = 50
  }

  // Header
  pdf.setFontSize(18)
  pdf.setFont('helvetica', 'bold')
  pdf.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 15

  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('Official Course Registration Form', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Session badge
  pdf.setFillColor(230, 245, 255)
  pdf.roundedRect(pageWidth / 2 - 80, y, 160, 20, 3, 3, 'F')
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 80, 150)
  pdf.text(`Academic Session ${data.session}`, pageWidth / 2, y + 13, { align: 'center' })
  pdf.setTextColor(0, 0, 0)
  y += 25

  if (data.semester !== 'all') {
    pdf.setFillColor(245, 255, 245)
    pdf.roundedRect(pageWidth / 2 - 60, y, 120, 20, 3, 3, 'F')
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(0, 120, 50)
    pdf.text(`${data.semester.charAt(0).toUpperCase() + data.semester.slice(1)} Semester`, pageWidth / 2, y + 13, { align: 'center' })
    pdf.setTextColor(0, 0, 0)
    y += 25
  }

  // Student Information Section
  y += 10
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Student Information', 50, y)
  y += 15

  const studentInfo = [
    { label: 'Full Name:', value: `${data.student.firstName} ${data.student.lastName}` },
    { label: 'Matric Number:', value: data.student.matricNumber || 'Not assigned' },
    { label: 'Email Address:', value: data.student.email },
    { label: 'Phone Number:', value: data.student.phone || 'Not provided' },
    { label: 'Department:', value: data.student.departmentName || 'Not assigned' },
    { label: 'Program:', value: data.student.programTitle || 'Not assigned' },
    { label: 'Current Level:', value: data.student.currentLevel ? `${data.student.currentLevel}L` : 'Not specified' },
    { label: 'Admission Session:', value: data.student.admissionSession || 'Not specified' },
  ]

  pdf.setFontSize(9)
  studentInfo.forEach((info, index) => {
    const col = index % 2
    const row = Math.floor(index / 2)
    const x = col === 0 ? 50 : pageWidth / 2 + 20
    const yPos = y + (row * 20)

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(100, 100, 100)
    pdf.text(info.label, x, yPos)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(0, 0, 0)
    pdf.text(info.value, x + 100, yPos)
  })

  y += 90

  // Courses Section
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text('Registered Courses', 50, y)
  y += 15

  const totalCredits = data.courses.reduce((sum, course) => sum + course.credits, 0)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(0, 80, 150)
  pdf.text(`Total Credit Units: ${totalCredits}`, pageWidth - 50, y, { align: 'right' })
  pdf.setTextColor(0, 0, 0)
  y += 15

  // Table header
  const tableX = 50
  const tableWidth = pageWidth - 100
  const colWidths = [30, 70, tableWidth - 230, 50, 50, 40, 60]
  const headers = ['S/N', 'Code', 'Title', 'Credits', 'Semester', 'Level', 'Approved Date']

  pdf.setFillColor(245, 245, 245)
  pdf.rect(tableX, y - 8, tableWidth, 12, 'F')
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  let currentX = tableX
  headers.forEach((header, index) => {
    pdf.text(header, currentX + 5, y, { maxWidth: colWidths[index] })
    currentX += colWidths[index]
  })
  y += 12

  // Table rows
  pdf.setFont('helvetica', 'normal')
  data.courses.forEach((course, index) => {
    const row = [
      String(index + 1),
      course.code,
      course.title,
      String(course.credits),
      course.semester.charAt(0).toUpperCase() + course.semester.slice(1),
      `${course.level}L`,
      course.reviewedAt ? new Date(course.reviewedAt).toLocaleDateString() : 'N/A',
    ]
    
    currentX = tableX
    row.forEach((cell, cellIndex) => {
      pdf.text(cell, currentX + 5, y, { maxWidth: colWidths[cellIndex] })
      currentX += colWidths[cellIndex]
    })
    
    pdf.setDrawColor(230, 230, 230)
    pdf.line(tableX, y + 2, tableX + tableWidth, y + 2)
    pdf.setDrawColor(0, 0, 0)
    y += 12
  })

  y += 15

  // Summary Section
  pdf.setFillColor(245, 250, 255)
  pdf.roundedRect(50, y - 10, pageWidth - 100, 50, 5, 5, 'F')
  
  const summaryData = [
    { label: 'Total Courses:', value: String(data.courses.length) },
    { label: 'Total Credit Units:', value: String(totalCredits) },
    { label: 'Registration Status:', value: 'Approved' },
  ]

  summaryData.forEach((item, index) => {
    const x = 80 + (index * ((pageWidth - 100) / 3))
    pdf.setFontSize(9)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(100, 100, 100)
    pdf.text(item.label, x, y + 5)
    pdf.setFontSize(14)
    pdf.setFont('helvetica', 'bold')
    if (index === 2) {
      pdf.setTextColor(0, 120, 50)
    } else {
      pdf.setTextColor(0, 80, 150)
    }
    pdf.text(item.value, x, y + 20)
  })

  y += 60

  // Footer
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(100, 100, 100)
  pdf.text('This document is officially generated by the Covenant College of Health Technology portal.', pageWidth / 2, y, { align: 'center' })
  y += 10
  pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' })

  return pdf.output('arraybuffer')
}
