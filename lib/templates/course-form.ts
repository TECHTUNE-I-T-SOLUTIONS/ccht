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
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pw = pdf.internal.pageSize.getWidth()
  const ph = pdf.internal.pageSize.getHeight()
  const margin = 14
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
    pdf.rect(0, ph - 8, pw, 8, 'F')
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(...white)
    pdf.text('Covenant College of Health Technology | Official Document', pw / 2, ph - 3, { align: 'center' })

    pdf.addPage()
    y = margin
  }

  const checkPageBreak = (needed: number) => {
    if (y + needed > ph - margin - 10) {
      addNewPage()
      return true
    }
    return false
  }

  const drawFooterOnLastPage = () => {
    pdf.setFillColor(...primary)
    pdf.rect(0, ph - 8, pw, 8, 'F')
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'italic')
    pdf.setTextColor(...white)
    pdf.text('Covenant College of Health Technology | Official Document', pw / 2, ph - 3, { align: 'center' })
  }

  // ══════════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════════

  // Top bar
  pdf.setFillColor(...primary)
  pdf.rect(0, 0, pw, 3, 'F')

  pdf.setFontSize(13)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pw / 2, y + 8, { align: 'center' })
  y += 11

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  pdf.text('OFFICIAL COURSE REGISTRATION FORM', pw / 2, y, { align: 'center' })
  y += 7

  // Decorative line
  pdf.setDrawColor(...primary)
  pdf.setLineWidth(0.4)
  pdf.line(margin, y, pw - margin, y)
  y += 6

  // ══════════════════════════════════════════════════
  // SESSION INFO
  // ══════════════════════════════════════════════════
  const semesterLabel = data.semester !== 'all'
    ? data.semester.charAt(0).toUpperCase() + data.semester.slice(1) + ' Semester'
    : 'All Semesters'

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...dark)
  
  // Session info in a simple line
  pdf.text(`Academic Session: ${data.session}     Semester: ${semesterLabel}`, margin, y)
  y += 8

  // ══════════════════════════════════════════════════
  // STUDENT INFORMATION
  // ══════════════════════════════════════════════════
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('STUDENT INFORMATION', margin, y)
  y += 5

  // Student info in a 2-col grid
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

  const cellH = 6
  const colW = (usableW - 4) / 2 // 2 columns with 4mm gap

  checkPageBreak(studentFields.length * cellH / 2 + 10)

  pdf.setFontSize(7)
  studentFields.forEach((field, idx) => {
    const col = idx % 2
    const row = Math.floor(idx / 2)
    const cx = margin + col * (colW + 4)
    const cy = y + row * cellH

    pdf.setFillColor(...lightGray)
    pdf.rect(cx, cy, colW, cellH, 'F')
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.2)
    pdf.rect(cx, cy, colW, cellH, 'S')

    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80, 80, 80)
    pdf.text(field.label, cx + 2, cy + 4)

    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(...dark)
    const valWidth = colW - 30
    let val = field.value
    if (val.length > Math.floor(valWidth / 2)) val = val.substring(0, Math.floor(valWidth / 2) - 2) + '..'
    pdf.text(val, cx + 28, cy + 4)
  })

  y += Math.ceil(studentFields.length / 2) * cellH + 8

  // ══════════════════════════════════════════════════
  // REGISTERED COURSES
  // ══════════════════════════════════════════════════
  checkPageBreak(30)

  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...primary)
  pdf.text('REGISTERED COURSES', margin, y)
  y += 5

  const totalCredits = data.courses.reduce((sum, c) => sum + c.credits, 0)

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  pdf.text(`Total Credit Units: ${totalCredits}`, pw - margin, y, { align: 'right' })
  pdf.setTextColor(...dark)
  y += 7

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
  const tableX = margin
  const snW = 10
  const codeW = 22
  const titleW = usableW - snW - codeW - 18 - 16 - 20 // remaining for title
  const credW = 14
  const levelW = 14
  const dateW = 18

  // Render each semester
  semesterOrder.forEach(sem => {
    const courses = coursesBySem[sem] || []
    if (courses.length === 0) return

    const semCredits = courses.reduce((s, c) => s + c.credits, 0)
    const semesterLabel = sem === '1' ? 'First Semester' : sem === '2' ? 'Second Semester' : `${sem} Semester`

    // Semester header
    checkPageBreak(12 + courses.length * 5 + 10)

    pdf.setFillColor(235, 242, 255)
    pdf.rect(margin, y, usableW, 7, 'F')
    pdf.setDrawColor(200, 215, 240)
    pdf.setLineWidth(0.3)
    pdf.rect(margin, y, usableW, 7, 'S')

    pdf.setFontSize(8)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...primary)
    pdf.text(semesterLabel, margin + 3, y + 4.5)
    pdf.setFontSize(7)
    pdf.text(`${semCredits} CU`, pw - margin - 3, y + 4.5, { align: 'right' })
    y += 9

    // Table header
    pdf.setFillColor(245, 245, 248)
    pdf.rect(margin, y, usableW, 6, 'F')
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.2)
    pdf.rect(margin, y, usableW, 6, 'S')

    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(80, 80, 80)
    pdf.text('S/N', margin + 2, y + 4)
    pdf.text('Code', margin + snW + 2, y + 4)
    pdf.text('Course Title', margin + snW + codeW + 2, y + 4)
    pdf.text('Credits', margin + snW + codeW + titleW + 2, y + 4)
    pdf.text('Level', margin + snW + codeW + titleW + credW + 2, y + 4)
    pdf.text('Approved', margin + snW + codeW + titleW + credW + levelW + 2, y + 4)
    y += 6

    // Course rows
    courses.forEach((course, idx) => {
      checkPageBreak(5)

      // Row background
      if (idx % 2 === 0) {
        pdf.setFillColor(252, 252, 255)
        pdf.rect(margin, y, usableW, 5, 'F')
      }

      pdf.setDrawColor(220, 220, 225)
      pdf.setLineWidth(0.15)
      pdf.line(margin, y, margin + usableW, y)

      pdf.setFontSize(6.5)
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

      // Truncate long text
      const titleMaxChars = Math.floor(titleW / 2.2)
      if (title.length > titleMaxChars) title = title.substring(0, titleMaxChars - 2) + '..'
      const codeMaxChars = Math.floor(codeW / 2.5)
      if (code.length > codeMaxChars) code = code.substring(0, codeMaxChars - 2) + '..'

      pdf.text(sn, margin + snW / 2, y + 3.5, { align: 'center' })
      pdf.text(code, margin + snW + 1, y + 3.5)
      pdf.text(title, margin + snW + codeW + 1, y + 3.5)
      pdf.text(creditStr, margin + snW + codeW + titleW + credW / 2, y + 3.5, { align: 'center' })
      pdf.text(levelStr, margin + snW + codeW + titleW + credW + levelW / 2, y + 3.5, { align: 'center' })
      pdf.text(dateStr, margin + snW + codeW + titleW + credW + levelW + 1, y + 3.5)

      y += 5
    })

    // Bottom line
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.2)
    pdf.line(margin, y, margin + usableW, y)
    y += 7
  })

  // ══════════════════════════════════════════════════
  // SUMMARY BOX
  // ══════════════════════════════════════════════════
  checkPageBreak(15)

  pdf.setFillColor(240, 248, 255)
  pdf.setDrawColor(0, 70, 150)
  pdf.setLineWidth(0.4)
  pdf.rect(margin, y, usableW, 8, 'FD')

  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'bold')
  pdf.setTextColor(...dark)
  pdf.text(`Total Courses: ${data.courses.length}`, margin + 4, y + 5)
  pdf.text(`Total Credit Units: ${totalCredits}`, pw / 2, y + 5, { align: 'center' })
  pdf.setTextColor(0, 120, 50)
  pdf.text('Status: Approved', pw - margin - 4, y + 5, { align: 'right' })
  y += 12

  // ══════════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════════
  if (y + 20 > ph - 8) {
    addNewPage()
  }

  const now = new Date()
  const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

  pdf.setDrawColor(200, 200, 200)
  pdf.setLineWidth(0.3)
  pdf.line(margin, ph - 22, pw - margin, ph - 22)

  pdf.setFontSize(7)
  pdf.setFont('helvetica', 'normal')
  pdf.setTextColor(80, 80, 80)
  pdf.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pw / 2, ph - 16, { align: 'center' })
  pdf.setFont('helvetica', 'italic')
  pdf.text('Excellence in Health Education', pw / 2, ph - 12, { align: 'center' })
  pdf.setFont('helvetica', 'normal')
  pdf.text(`Generated: ${dateStr}`, pw / 2, ph - 8.5, { align: 'center' })

  drawFooterOnLastPage()

  // Page numbers
  const pc = pdf.getNumberOfPages()
  for (let i = 1; i <= pc; i++) {
    pdf.setPage(i)
    pdf.setFontSize(6)
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(150, 150, 150)
    pdf.text(`Page ${i} of ${pc}`, pw - margin, 6, { align: 'right' })
  }

  return pdf.output('arraybuffer')
}