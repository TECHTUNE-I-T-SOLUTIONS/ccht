import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface AdmissionLetterData {
  firstName: string
  lastName: string
  matricNumber: string
  program: string
  department: string
  level: string
  admissionDate: string
  orientationDate?: string
  registrationDeadline?: string
  firstDayOfClass?: string
}

export async function generateAdmissionLetter(data: AdmissionLetterData): Promise<Uint8Array> {
  const {
    firstName,
    lastName,
    matricNumber,
    program,
    department,
    level,
    admissionDate,
    orientationDate = 'To be announced',
    registrationDeadline = 'To be announced',
    firstDayOfClass = 'To be announced'
  } = data

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([595.28, 841.89]) // A4 size in points
  const { height, width } = page.getSize()
  const margin = 50
  let y = height - margin

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // Draw decorative border
  page.drawLine({
    start: { x: margin, y: margin },
    end: { x: width - margin, y: margin },
    thickness: 1,
    color: rgb(0, 0.4, 0.8),
  })
  page.drawLine({
    start: { x: margin, y: height - margin },
    end: { x: width - margin, y: height - margin },
    thickness: 1,
    color: rgb(0, 0.4, 0.8),
  })

  // Header - Letterhead style
  page.drawText('COVENANT COLLEGE OF HEALTH TECHNOLOGY', {
    x: width / 2,
    y: y,
    size: 16,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 10

  page.drawText('Excellence in Health Education | Training Future Healthcare Leaders', {
    x: width / 2,
    y: y,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })
  y -= 7

  page.drawText('Accredited by the National Board for Technical Education (NBTE)', {
    x: width / 2,
    y: y,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })
  y -= 15

  // Decorative line
  page.drawLine({
    start: { x: margin + 10, y: y },
    end: { x: width - margin - 10, y: y },
    thickness: 0.3,
    color: rgb(0, 0.4, 0.8),
  })
  y -= 15

  // Document title
  page.drawText('OFFICIAL ADMISSION LETTER', {
    x: width / 2,
    y: y,
    size: 14,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 10

  page.drawText(`Reference: CCHT/ADM/${new Date().getFullYear()}/${matricNumber.split('/').pop()}`, {
    x: width / 2,
    y: y,
    size: 9,
    font: fontItalic,
    color: rgb(0, 0, 0),
  })
  y -= 15

  // Date
  page.drawText(`Date: ${admissionDate}`, {
    x: width - margin,
    y: y,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })
  y -= 15

  // Salutation
  page.drawText(`Dear ${firstName} ${lastName},`, {
    x: margin,
    y: y,
    size: 11,
    font: font,
    color: rgb(0, 0, 0),
  })
  y -= 15

  // Subject
  page.drawText(`RE: ADMISSION INTO ${program.toUpperCase()} PROGRAM`, {
    x: margin,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 15

  // Opening paragraph
  const openingText = `We are delighted to inform you that you have been offered provisional admission into the ${program} program at Covenant College of Health Technology for the ${new Date().getFullYear()}/${new Date().getFullYear() + 1} academic session. This admission is based on your satisfactory performance in the entrance examination and meeting all admission requirements.`
  const splitOpening = splitText(openingText, 80)
  splitOpening.forEach(line => {
    page.drawText(line, {
      x: margin,
      y: y,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    })
    y -= 6
  })
  y -= 10

  // Admission Details Box
  page.drawRectangle({
    x: margin,
    y: y - 45,
    width: width - 2 * margin,
    height: 45,
    borderColor: rgb(0, 0.4, 0.8),
    borderWidth: 0.3,
  })
  y -= 8

  page.drawText('ADMISSION DETAILS', {
    x: margin + 5,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 8

  const details = [
    { label: 'Student Name:', value: `${firstName} ${lastName}` },
    { label: 'Matric Number:', value: matricNumber },
    { label: 'Program:', value: program },
    { label: 'Department:', value: department },
    { label: 'Current Level:', value: `${level}L` },
    { label: 'Admission Date:', value: admissionDate },
    { label: 'Admission Status:', value: 'PROVISIONAL' }
  ]

  details.forEach((detail, index) => {
    const xPos = index % 2 === 0 ? margin + 10 : width / 2 + 5
    const yPos = y - Math.floor(index / 2) * 6
    page.drawText(detail.label, {
      x: xPos,
      y: yPos,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    page.drawText(detail.value, {
      x: xPos + 30,
      y: yPos,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    })
  })
  y -= 28

  // Conditions for Admission
  page.drawText('CONDITIONS FOR ADMISSION', {
    x: margin,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 10

  const conditions = [
    '1. PAYMENT OF ACCEPTANCE AND TUITION FEES: All required fees must be paid within the stipulated period.',
    '2. COMPLETION OF REGISTRATION: Complete all registration formalities within the first two weeks.',
    '3. SUBMISSION OF REQUIRED DOCUMENTS: Original copies must be presented for verification.',
    '4. MEDICAL FITNESS CERTIFICATE: Submit from a government-approved hospital during registration.',
    '5. ACADEMIC PERFORMANCE: Maintain minimum CGPA of 2.0 to remain in good standing.',
    '6. ATTENDANCE REQUIREMENT: Maintain minimum 75% attendance in all courses.',
    '7. CODE OF CONDUCT: Adhere strictly to the college code of conduct and regulations.'
  ]

  conditions.forEach(condition => {
    const split = splitText(condition, 80)
    split.forEach(line => {
      page.drawText(line, {
        x: margin + 5,
        y: y,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      })
      y -= 5
    })
    y -= 2
  })

  y -= 5

  // Important Dates
  page.drawText('IMPORTANT DATES AND DEADLINES', {
    x: margin,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 10

  const dates = [
    { label: 'Orientation Program:', value: orientationDate },
    { label: 'Registration Deadline:', value: registrationDeadline },
    { label: 'First Day of Classes:', value: firstDayOfClass },
    { label: 'Late Registration Ends:', value: 'Two weeks after registration deadline' }
  ]

  dates.forEach(date => {
    page.drawText(date.label, {
      x: margin + 5,
      y: y,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    page.drawText(date.value, {
      x: margin + 60,
      y: y,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    })
    y -= 6
  })

  y -= 10

  // Contact Information
  page.drawText('CONTACT INFORMATION', {
    x: margin,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 10

  const contacts = [
    { label: 'College Email:', value: 'info@covenantcollegeofhealthtech.com.ng' },
    { label: 'College Phone:', value: '+2347066369818' },
    { label: 'College Website:', value: 'https://www.covenantcollegeofhealthtech.com.ng' }
  ]

  contacts.forEach(contact => {
    page.drawText(contact.label, {
      x: margin + 5,
      y: y,
      size: 8,
      font: fontBold,
      color: rgb(0, 0, 0),
    })
    page.drawText(contact.value, {
      x: margin + 55,
      y: y,
      size: 8,
      font: font,
      color: rgb(0, 0, 0),
    })
    y -= 6
  })

  y -= 10

  // Important Notice
  page.drawRectangle({
    x: margin,
    y: y - 25,
    width: width - 2 * margin,
    height: 25,
    borderColor: rgb(1, 0, 0),
    borderWidth: 0.5,
  })
  y -= 8

  page.drawText('IMPORTANT NOTICE', {
    x: width / 2,
    y: y,
    size: 11,
    font: fontBold,
    color: rgb(1, 0, 0),
  })
  y -= 8

  const notice = 'This admission is provisional and subject to verification of all submitted documents. Any false information provided may result in immediate withdrawal of admission.'
  const splitNotice = splitText(notice, 80)
  splitNotice.forEach(line => {
    page.drawText(line, {
      x: margin + 5,
      y: y,
      size: 9,
      font: font,
      color: rgb(0, 0, 0),
    })
    y -= 5
  })

  y -= 10

  // Congratulations and Closing
  const congrats = 'Congratulations on your admission to Covenant College of Health Technology. We look forward to welcoming you to our community of future healthcare professionals.'
  const splitCongrats = splitText(congrats, 80)
  splitCongrats.forEach(line => {
    page.drawText(line, {
      x: margin,
      y: y,
      size: 10,
      font: font,
      color: rgb(0, 0, 0),
    })
    y -= 6
  })
  y -= 15

  // Signature Section
  page.drawText('Yours faithfully,', {
    x: margin,
    y: y,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })
  y -= 15
  page.drawText('The Registrar', {
    x: margin,
    y: y,
    size: 10,
    font: fontBold,
    color: rgb(0, 0, 0),
  })
  y -= 6
  page.drawText('Covenant College of Health Technology', {
    x: margin,
    y: y,
    size: 10,
    font: font,
    color: rgb(0, 0, 0),
  })
  y -= 10

  // Signature line
  page.drawLine({
    start: { x: margin, y: y },
    end: { x: margin + 50, y: y },
    thickness: 0.3,
    color: rgb(0, 0, 0),
  })
  y -= 5
  page.drawText('Signature & Date', {
    x: margin,
    y: y,
    size: 8,
    font: font,
    color: rgb(0, 0, 0),
  })

  // Footer
  y = margin + 15
  page.drawText('This document is official and confidential.', {
    x: width / 2,
    y: y,
    size: 8,
    font: fontItalic,
    color: rgb(0.5, 0.5, 0.5),
  })
  y -= 5
  page.drawText('Covenant College of Health Technology - Excellence in Health Education', {
    x: width / 2,
    y: y,
    size: 8,
    font: fontItalic,
    color: rgb(0.5, 0.5, 0.5),
  })

  return await pdfDoc.save()
}

function splitText(text: string, maxChars: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxChars) {
      currentLine += (currentLine ? ' ' : '') + word
    } else {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    }
  })
  if (currentLine) lines.push(currentLine)

  return lines
}
