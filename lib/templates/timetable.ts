import jsPDF from 'jspdf'

export interface TimetableEntry {
  id: string
  course_code: string
  course_title: string
  day_of_week: string
  start_time: string
  end_time: string
  venue?: string
  lecturer_name?: string
}

export interface OnlineClassInfo {
  course_code: string
  day_of_week: string
  start_time: string
  end_time: string
  meet_link: string
  class_date?: string
}

export interface TimetableData {
  title: string
  session: string
  semester: string
  program: string
  level: string
  entries: TimetableEntry[]
  onlineClasses?: OnlineClassInfo[]
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

const PRIMARY: [number, number, number] = [0, 70, 150]
const LIGHT_GRAY: [number, number, number] = [245, 245, 245]
const BORDER: [number, number, number] = [200, 200, 200]
const WHITE: [number, number, number] = [255, 255, 255]
const DARK: [number, number, number] = [30, 30, 30]

export function generateTimetablePDF(data: TimetableData): jsPDF {
  const doc = new jsPDF('l', 'mm', 'a4')
  const pw = doc.internal.pageSize.width
  const ph = doc.internal.pageSize.height
  const margin = 15
  const usableW = pw - margin * 2
  let y = margin

  const timeColW = 22
  const dayColW = (usableW - timeColW) / DAYS.length
  const headerH = 10
  const rowH = 10

  // Track page number for header/footer
  let pageNum = 1

  const getEntryForSlot = (day: string, hourSlot: string) => {
    const slotHour = parseInt(hourSlot.split(':')[0])
    return data.entries.find(e => {
      if (e.day_of_week !== day) return false
      const sH = parseInt(e.start_time.split(':')[0])
      const eH = parseInt(e.end_time.split(':')[0])
      return slotHour >= sH && slotHour < eH
    })
  }

  const placedEntries = new Set<string>()

  const shouldRenderEntry = (day: string, hourSlot: string) => {
    const entry = getEntryForSlot(day, hourSlot)
    if (!entry) return null
    const key = `${day}|${entry.id}`
    if (placedEntries.has(key)) return null
    return entry
  }

  // ── Header at top of each page (small, compact) ──
  const drawPageHeader = () => {
    // School name and timetable title
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...PRIMARY)
    doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pw / 2, y + 6, { align: 'center' })

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    doc.text('WEEKLY CLASS TIMETABLE', pw / 2, y + 11, { align: 'center' })

    // Compact session info - one line
    doc.setFontSize(7)
    doc.setTextColor(...DARK)
    const infoStr = `${data.session} | ${data.semester} | ${data.program} | Level ${data.level}L`
    doc.text(infoStr, pw / 2, y + 16, { align: 'center' })

    // Top bar accent line
    doc.setDrawColor(...PRIMARY)
    doc.setLineWidth(0.4)
    doc.line(margin, y + 18, pw - margin, y + 18)
    
    // Generation date and page
    doc.setFontSize(6)
    doc.setTextColor(150, 150, 150)
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    doc.text(`Generated: ${dateStr}`, margin, y + 4, { align: 'left' })

    y += 22
  }

  // ── Table header row (dark blue bg, white text) ──
  const drawTableHeader = () => {
    const headerColor: [number, number, number] = [0, 50, 110]
    doc.setFillColor(...headerColor)

    // Time cell
    doc.rect(margin, y, timeColW, headerH, 'F')
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...WHITE)
    doc.text('TIME', margin + timeColW / 2, y + headerH / 2 + 1.5, { align: 'center' })

    // Day cells
    DAYS_SHORT.forEach((dayLabel, i) => {
      const x = margin + timeColW + i * dayColW
      doc.setFillColor(...headerColor)
      doc.rect(x, y, dayColW, headerH, 'F')
      doc.text(dayLabel.toUpperCase(), x + dayColW / 2, y + headerH / 2 + 1.5, { align: 'center' })
    })
    y += headerH
  }

  // ── Footer ──
  const drawFooter = () => {
    doc.setFillColor(...PRIMARY)
    doc.rect(0, ph - 8, pw, 8, 'F')
    doc.setFontSize(6)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(...WHITE)
    doc.text(
      'Covenant College of Health Technology | Official Document',
      pw / 2,
      ph - 3,
      { align: 'center' }
    )
  }

  // ── First page header ──
  drawPageHeader()
  drawTableHeader()

  // ── Time rows ──
  TIME_SLOTS.forEach((slot, rowIdx) => {
    // Check if we need a new page
    if (y + rowH > ph - margin - 5) {
      drawFooter()
      doc.addPage('a4', 'l')
      pageNum++
      y = margin
      drawPageHeader()
      drawTableHeader()
    }

    const isEven = rowIdx % 2 === 0

    // Row background
    if (isEven) {
      doc.setFillColor(248, 248, 252)
      doc.rect(margin, y, usableW, rowH, 'F')
    }

    // Top border line
    doc.setDrawColor(210, 210, 220)
    doc.setLineWidth(0.2)
    doc.line(margin, y, margin + usableW, y)

    // TIME cell - blue text on white
    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0, 60, 140) // darker blue
    doc.text(slot, margin + 2, y + rowH / 2 + 1.5)

    // Day cells
    DAYS.forEach((day, dayIdx) => {
      const cx = margin + timeColW + dayIdx * dayColW

      // Vertical grid lines
      if (dayIdx > 0) {
        doc.setDrawColor(210, 210, 220)
        doc.setLineWidth(0.15)
        doc.line(cx, y, cx, y + rowH)
      }

      const entry = shouldRenderEntry(day, slot) as TimetableEntry | null
      if (entry) {
        const sH = parseInt(entry.start_time.split(':')[0])
        const eH = parseInt(entry.end_time.split(':')[0])
        const span = Math.max(1, eH - sH)
        const cellH = Math.max(rowH, span * rowH)

        // Light blue cell background
        doc.setFillColor(230, 240, 255)
        doc.rect(cx, y, dayColW, cellH, 'F')

        // Cell border
        doc.setDrawColor(170, 200, 235)
        doc.setLineWidth(0.4)
        doc.rect(cx, y, dayColW, cellH, 'S')

        // Course code - blue, bold
        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(0, 60, 140)
        let code = entry.course_code
        const maxChars = Math.max(5, Math.floor((dayColW - 3) / 2.8))
        if (code.length > maxChars) code = code.substring(0, maxChars - 2) + '..'
        doc.text(code, cx + 1.5, y + 4)

        // Time range below
        doc.setFontSize(5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(80, 100, 120)
        doc.text(`${entry.start_time}-${entry.end_time}`, cx + 1.5, y + 7)

        // Venue
        if (entry.venue && entry.venue !== 'TBA') {
          doc.setFontSize(5)
          doc.setTextColor(100, 115, 130)
          let ven = entry.venue
          const maxV = Math.max(3, Math.floor((dayColW - 3) / 2.5))
          if (ven.length > maxV) ven = ven.substring(0, maxV - 2) + '..'
          doc.text(ven, cx + 1.5, y + 9.5)
        }

        placedEntries.add(`${day}|${entry.id}`)
      }

      // Right edge border
      if (dayIdx === DAYS.length - 1) {
        doc.setDrawColor(210, 210, 220)
        doc.setLineWidth(0.15)
        doc.line(cx + dayColW, y, cx + dayColW, y + rowH)
      }
    })

    y += rowH
  })

  // Bottom table border
  doc.setDrawColor(210, 210, 220)
  doc.setLineWidth(0.3)
  doc.line(margin, y, margin + usableW, y)

  // ── Legend ──
  y += 8
  if (y + 40 > ph - margin) {
    drawFooter()
    doc.addPage('a4', 'l')
    pageNum++
    y = margin
    drawPageHeader()
  }

  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pw - margin, y)
  y += 6

  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text('KEY / NOTES:', margin, y)
  y += 5

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(80, 80, 80)

  const venues = [...new Set(data.entries.filter(e => e.venue && e.venue !== 'TBA').map(e => e.venue!))]
  const lecturers = [...new Set(data.entries.filter(e => e.lecturer_name && e.lecturer_name !== 'TBA').map(e => e.lecturer_name!))]
  const courses = [...new Map(data.entries.map(e => [e.course_code, e.course_code])).values()]

  if (venues.length > 0) {
    doc.text(`Venues: ${venues.join(', ')}`, margin + 2, y)
    y += 4
  }
  if (lecturers.length > 0) {
    doc.text(`Lecturers: ${lecturers.join(', ')}`, margin + 2, y)
    y += 4
  }
  if (courses.length > 0) {
    doc.text(`Courses: ${courses.join(', ')}`, margin + 2, y)
    y += 4
  }

  // ── Online Classes ──
  if (data.onlineClasses && data.onlineClasses.length > 0) {
    y += 3
    if (y + 25 > ph - margin - 8) {
      drawFooter()
      doc.addPage('a4', 'l')
      pageNum++
      y = margin
      drawPageHeader()
    }

    doc.setDrawColor(...PRIMARY)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pw - margin, y)
    y += 6

    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text('ONLINE CLASSES:', margin, y)
    y += 5

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(80, 80, 80)

    data.onlineClasses.forEach((oc, idx) => {
      const dateStr = oc.class_date
        ? new Date(oc.class_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        : oc.day_of_week.substring(0, 3)

      if (y + 4 > ph - margin - 8) {
        drawFooter()
        doc.addPage('a4', 'l')
        pageNum++
        y = margin
        drawPageHeader()
      }

      doc.text(
        `${idx + 1}. ${oc.course_code} | ${dateStr} | ${oc.start_time}-${oc.end_time} | ${oc.meet_link}`,
        margin + 2,
        y
      )
      y += 4
    })
  }

  // ── Footer on last page ──
  drawFooter()

  // ── Page numbers ──
  const pc = doc.getNumberOfPages()
  for (let i = 1; i <= pc; i++) {
    doc.setPage(i)
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(`Page ${i} of ${pc}`, pw - margin, 6, { align: 'right' })
  }

  return doc
}