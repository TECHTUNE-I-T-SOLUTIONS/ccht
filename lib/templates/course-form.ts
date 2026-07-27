import jsPDF from 'jspdf'
import { readFileSync } from 'fs'
import { join } from 'path'

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
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pw = pdf.internal.pageSize.getWidth()
  const ph = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableW = pw - margin * 2
  let y = margin

  // Color constants
  const primary: [number, number, number] = [0, 70, 150]
  const dark: [number, number, number] = [30, 30, 30]
  const gray: [number, number, number] = [80, 80, 80]
  const lightGray: [number, number, number] = [245, 245, 245]
  const white: [number, number, number] = [255, 255, 255]

  const addNewPage = () => {
    // Footer on current page
    pdf.setFillColor(...primary)
    pdf.rect(0, ph - 6, pw, 6, 'F')
    pdf.setFontSize(5)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(...white)
    pdf.text('Covenant College of Health Technology | Official Document', pw / 2, ph - 2.5, { align: 'center' })

    pdf.addPage()
    y = margin
  }

  const checkPageBreak = (needed: number) => {
    if (y + needed > ph - margin - 8) {
      addNewPage()
      return true
    }
    return false
  }

  const drawFooterOnLastPage = () => {
    pdf.setFillColor(...primary)
    pdf.rect(0, ph - 6, pw, 6, 'F')
    pdf.setFontSize(5)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(...white)
    pdf.text('Covenant College of Health Technology | Official Document', pw / 2, ph - 2.5, { align: 'center' })
  }

  // ══════════════════════════════════════════════════
  // HEADER WITH LOGO
  // ══════════════════════════════════════════════════
  
  // Top accent bar
  pdf.setFillColor(...primary)
  pdf.rect(0, 0, pw, 2, 'F')

  y += 2

  // Load and add school logo
  try {
    const logoPath = join(process.cwd(), 'public', 'apple-icon.png')
    const logoData = readFileSync(logoPath)
    const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`
    const logoSize = 10
    const logoX = pw / 2
    const logoY = y + logoSize / 2
    
    pdf.addImage(logoBase64, 'PNG', logoX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize)
    y += logoSize + 2
  } catch (error) {
    // Fallback to text if logo not found
    const logoSize = 8
    const logoX = pw / 2
    const logoY = y + logoSize / 2
    
    pdf.setFillColor(...primary)
    pdf.circle(logoX, logoY, logoSize / 2, 'F')
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...white)
    pdf.text('CCHT', logoX, logoY + 1, { align: 'center' })
    y += logoSize + 2
  }

  // School name
  pdf.setFontSize(11)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pw / 2, y + 4, { align: 'center' })
  y += 6

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  pdf.text('OFFICIAL COURSE REGISTRATION FORM', pw / 2, y + 3, { align: 'center' })
  y += 5

  // Decorative line
  pdf.setDrawColor(...primary)
  pdf.setLineWidth(0.3)
  pdf.line(margin, y, pw - margin, y)
  y += 3

  // ══════════════════════════════════════════════════
  // SESSION INFO
  // ══════════════════════════════════════════════════
  const semesterLabel = data.semester !== 'all'
    ? data.semester.charAt(0).toUpperCase() + data.semester.slice(1) + ' Semester'
    : 'All Semesters'

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...dark)
  
  pdf.text(`Academic Session: ${data.session}     Semester: ${semesterLabel}`, margin, y)
  y += 4

  // ══════════════════════════════════════════════════
  // STUDENT INFORMATION
  // ══════════════════════════════════════════════════
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('STUDENT INFORMATION', margin, y)
  y += 3

  // Student info in a 2-col grid - no truncation
  const studentFields = [
    { label: 'Name', value: `${data.student.firstName} ${data.student.lastName}` },
    { label: 'Email', value: data.student.email },
    { label: 'Matric No', value: data.student.matricNumber || 'N/A' },
    { label: 'Phone', value: data.student.phone || 'N/A' },
    { label: 'Program', value: data.student.programTitle || 'N/A' },
    { label: 'Department', value: data.student.departmentName || 'N/A' },
    { label: 'Level', value: data.student.currentLevel ? `${data.student.currentLevel}L` : 'N/A' },
    { label: 'Admission', value: data.student.admissionSession || 'N/A' },
  ]

  const cellH = 5
  const colW = (usableW - 3) / 2

  pdf.setFontSize(6.5)
  studentFields.forEach((field, idx) => {
    const col = idx % 2
    const row = Math.floor(idx / 2)
    const cx = margin + col * (colW + 3)
    const cy = y + row * cellH

    pdf.setFillColor(...lightGray)
    pdf.rect(cx, cy, colW, cellH, 'F')
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.15)
    pdf.rect(cx, cy, colW, cellH, 'S')

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80, 80, 80)
    pdf.text(field.label, cx + 1.5, cy + 3.2)

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...dark)
    pdf.text(field.value, cx + 28, cy + 3.2)
  })

  y += Math.ceil(studentFields.length / 2) * cellH + 3

  // ══════════════════════════════════════════════════
  // REGISTERED COURSES
  // ══════════════════════════════════════════════════
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('REGISTERED COURSES', margin, y)
  y += 3

  const totalCredits = data.courses.reduce((sum, c) => sum + c.credits, 0)

  pdf.setFontSize(6.5)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  pdf.text(`Total Credit Units: ${totalCredits}`, pw - margin, y, { align: 'right' })
  pdf.setTextColor(...dark)
  y += 4

  // Group courses by semester - ensure semester is string
  const semesterOrder = data.semester === 'all' 
    ? [...new Set(data.courses.map(c => String(c.semester)))].sort()
    : [data.semester]

  const coursesBySem = data.courses.reduce((acc, c) => {
    const semKey = String(c.semester)
    if (!acc[semKey]) acc[semKey] = []
    acc[semKey].push(c)
    return acc
  }, {} as Record<string, typeof data.courses>)

  // Table column widths
  const snW = 8
  const codeW = 20
  const titleW = usableW - snW - codeW - 16 - 14 - 18
  const credW = 12
  const levelW = 12
  const dateW = 18

  // Render each semester
  semesterOrder.forEach(sem => {
    const courses = coursesBySem[sem] || []
    if (courses.length === 0) return

    const semCredits = courses.reduce((s, c) => s + c.credits, 0)
    const semesterLabel = sem === '1' ? 'First Semester' : sem === '2' ? 'Second Semester' : `${sem} Semester`

    // Semester header
    checkPageBreak(8 + courses.length * 4 + 8)

    pdf.setFillColor(235, 242, 255)
    pdf.rect(margin, y, usableW, 6, 'F')
    pdf.setDrawColor(200, 215, 240)
    pdf.setLineWidth(0.2)
    pdf.rect(margin, y, usableW, 6, 'S')

    pdf.setFontSize(7)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...primary)
    pdf.text(semesterLabel, margin + 2, y + 4)
    pdf.setFontSize(6.5)
    pdf.text(`${semCredits} CU`, pw - margin - 2, y + 4, { align: 'right' })
    y += 7

    // Table header
    pdf.setFillColor(245, 245, 248)
    pdf.rect(margin, y, usableW, 5, 'F')
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.15)
    pdf.rect(margin, y, usableW, 5, 'S')

    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80, 80, 80)
    pdf.text('S/N', margin + 1.5, y + 3.2)
    pdf.text('Code', margin + snW + 1.5, y + 3.2)
    pdf.text('Course Title', margin + snW + codeW + 1.5, y + 3.2)
    pdf.text('Credits', margin + snW + codeW + titleW + 1.5, y + 3.2)
    pdf.text('Level', margin + snW + codeW + titleW + credW + 1.5, y + 3.2)
    pdf.text('Approved', margin + snW + codeW + titleW + credW + levelW + 1.5, y + 3.2)
    y += 5

    // Course rows
    courses.forEach((course, idx) => {
      checkPageBreak(4)

      // Row background
      if (idx % 2 === 0) {
        pdf.setFillColor(252, 252, 255)
        pdf.rect(margin, y, usableW, 4, 'F')
      }

      pdf.setDrawColor(220, 220, 225)
      pdf.setLineWidth(0.1)
      pdf.line(margin, y, margin + usableW, y)

      pdf.setFontSize(6)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(...dark)

      const sn = String(idx + 1)
      let code = course.code
      let title = course.title
      const creditStr = String(course.credits)
      const levelStr = `${course.level}L`
      const dateStr = course.reviewedAt 
        ? new Date(course.reviewedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : 'N/A'

      pdf.text(sn, margin + snW / 2, y + 3, { align: 'center' })
      pdf.text(code, margin + snW + 1, y + 3)
      pdf.text(title, margin + snW + codeW + 1, y + 3)
      pdf.text(creditStr, margin + snW + codeW + titleW + credW / 2, y + 3, { align: 'center' })
      pdf.text(levelStr, margin + snW + codeW + titleW + credW + levelW / 2, y + 3, { align: 'center' })
      pdf.text(dateStr, margin + snW + codeW + titleW + credW + levelW + 1, y + 3)

      y += 4
    })

    // Bottom line
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.15)
    pdf.line(margin, y, margin + usableW, y)
    y += 4
  })

  // ══════════════════════════════════════════════════
  // SUMMARY BOX
  // ══════════════════════════════════════════════════
  checkPageBreak(10)

  pdf.setFillColor(240, 248, 255)
  pdf.setDrawColor(0, 70, 150)
  pdf.setLineWidth(0.3)
  pdf.rect(margin, y, usableW, 7, 'FD')

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...dark)
  pdf.text(`Total Courses: ${data.courses.length}`, margin + 3, y + 4.2)
  pdf.text(`Total Credit Units: ${totalCredits}`, pw / 2, y + 4.2, { align: 'center' })
  pdf.setTextColor(0, 120, 50)
  pdf.text('Status: Approved', pw - margin - 3, y + 4.2, { align: 'right' })
  y += 9

  // ══════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════
  if (y + 15 > ph - 6) {
    addNewPage()
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.2)
  pdf.line(margin, ph - 14, pw - margin, ph - 14)

  pdf.setFontSize(6)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  pdf.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pw / 2, ph - 10, { align: 'center' })
  pdf.setFont('helvetica', 'italic')
  pdf.text('Excellence in Health Education', pw / 2, ph - 7, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Generated: ${dateStr}`, pw / 2, ph - 4.5, { align: 'center' })

  drawFooterOnLastPage()

  // Page numbers
  const pc = pdf.getNumberOfPages()
  for (let i = 1; i <= pc; i++) {
    pdf.setPage(i)
    pdf.setFontSize(5.5)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text(`Page ${i} of ${pc}`, pw - margin, 5, { align: 'right' })
  }

  return pdf.output('arraybuffer')
}