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

export interface TimetableData {
  title: string
  session: string
  semester: string
  program: string
  level: string
  entries: TimetableEntry[]
}

export function generateTimetablePDF(data: TimetableData): jsPDF {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 20
  let y = margin

  // Add school logo placeholder (you'll replace this with actual logo)
  // doc.addImage(logoData, 'PNG', margin, y, 30, 30)
  // y += 35

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 10
  doc.setFontSize(14)
  doc.text('WEEKLY CLASS TIMETABLE', pageWidth / 2, y, { align: 'center' })
  y += 15

  // Session info
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const sessionInfo = [
    `Academic Session: ${data.session}`,
    `Semester: ${data.semester}`,
    `Program: ${data.program}`,
    `Level: ${data.level}L`
  ]
  
  sessionInfo.forEach((info, index) => {
    doc.text(info, pageWidth / 2, y, { align: 'center' })
    y += 6
  })
  y += 10

  // Group entries by day
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const entriesByDay = days.reduce((acc, day) => {
    acc[day] = data.entries.filter(entry => entry.day_of_week === day)
    return acc
  }, {} as Record<string, TimetableEntry[]>)

  // Table settings
  const tableStartY = y
  const colWidths = {
    time: 25,
    course: 50,
    venue: 30,
    lecturer: 45
  }
  const rowHeight = 8
  const tableWidth = pageWidth - (margin * 2)

  // Draw table for each day
  days.forEach(day => {
    const dayEntries = entriesByDay[day]
    
    // Check if we need a new page
    if (y + 20 + (dayEntries.length * rowHeight) > pageHeight - margin) {
      doc.addPage()
      y = margin
    }

    // Day header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(day, margin, y)
    y += 8

    if (dayEntries.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10)
      doc.text('No classes scheduled', margin + 5, y)
      y += 10
      return
    }

    // Table header
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y, tableWidth, rowHeight, 'F')
    
    doc.text('Time', margin + 2, y + 5)
    doc.text('Course', margin + colWidths.time + 2, y + 5)
    doc.text('Venue', margin + colWidths.time + colWidths.course + 2, y + 5)
    doc.text('Lecturer', margin + colWidths.time + colWidths.course + colWidths.venue + 2, y + 5)
    y += rowHeight

    // Table rows
    doc.setFont('helvetica', 'normal')
    dayEntries.forEach(entry => {
      // Alternate row background
      const rowY = y - rowHeight
      if ((dayEntries.indexOf(entry) % 2) === 0) {
        doc.setFillColor(250, 250, 250)
        doc.rect(margin, rowY, tableWidth, rowHeight, 'F')
      }

      doc.setFontSize(9)
      doc.text(`${entry.start_time} - ${entry.end_time}`, margin + 2, y + 5)
      doc.text(`${entry.course_code} - ${entry.course_title}`, margin + colWidths.time + 2, y + 5)
      doc.text(entry.venue || 'TBA', margin + colWidths.time + colWidths.course + 2, y + 5)
      doc.text(entry.lecturer_name || 'TBA', margin + colWidths.time + colWidths.course + colWidths.venue + 2, y + 5)
      y += rowHeight
    })

    y += 10
  })

  // Footer
  const footerY = pageHeight - 30
  doc.setFontSize(8)
  doc.setFont('helvetica', 'italic')
  doc.text('This document is official and confidential. Any unauthorized reproduction or distribution is prohibited.', margin, footerY)
  doc.setFont('helvetica', 'normal')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY - Excellence in Health Education', margin, footerY + 8)
  doc.text('For any clarifications, contact: students@ccht.edu.ng', margin, footerY + 16)

  return doc
}
