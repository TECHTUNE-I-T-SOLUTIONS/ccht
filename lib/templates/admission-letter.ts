import { jsPDF } from 'jspdf'

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

export function generateAdmissionLetter(data: AdmissionLetterData): jsPDF {
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

  const doc = new jsPDF()
  let y = 20

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('CROSS COLLEGE OF HEALTH TECHNOLOGY', 105, y, { align: 'center' })
  y += 10
  doc.setFontSize(14)
  doc.text('OFFICIAL ADMISSION LETTER', 105, y, { align: 'center' })
  y += 15

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(admissionDate, 105, y, { align: 'center' })
  y += 15

  // Salutation
  doc.setFontSize(11)
  doc.text(`Dear ${firstName} ${lastName},`, 20, y)
  y += 10

  // Subject
  doc.setFont('helvetica', 'bold')
  doc.text(`RE: ADMISSION INTO ${program.toUpperCase()} PROGRAM`, 20, y)
  y += 10

  // Main text
  doc.setFont('helvetica', 'normal')
  const text = `We are pleased to inform you that you have been offered admission into the ${program} program at Cross College of Health Technology for the ${new Date().getFullYear()}/${new Date().getFullYear() + 1} academic session.`
  const splitText = doc.splitTextToSize(text, 170)
  doc.text(splitText, 20, y)
  y += splitText.length * 5 + 10

  // Admission Details
  doc.setFont('helvetica', 'bold')
  doc.text('ADMISSION DETAILS:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`- Student Name: ${firstName} ${lastName}`, 25, y)
  y += 5
  doc.text(`- Matric Number: ${matricNumber}`, 25, y)
  y += 5
  doc.text(`- Program: ${program}`, 25, y)
  y += 5
  doc.text(`- Department: ${department}`, 25, y)
  y += 5
  doc.text(`- Current Level: ${level}L`, 25, y)
  y += 5
  doc.text(`- Admission Date: ${admissionDate}`, 25, y)
  y += 10

  // Conditions
  doc.setFont('helvetica', 'bold')
  doc.text('This admission is subject to the following conditions:', 20, y)
  y += 7

  const conditions = [
    '1. PAYMENT OF FEES: All required fees must be paid within the stipulated period as indicated in the fee schedule.',
    '2. REGISTRATION: You must complete all registration formalities within the first two weeks of the academic session.',
    '3. ACADEMIC REQUIREMENTS: You are expected to maintain satisfactory academic progress throughout your program.'
  ]

  doc.setFont('helvetica', 'normal')
  conditions.forEach(condition => {
    const split = doc.splitTextToSize(condition, 170)
    doc.text(split, 25, y)
    y += split.length * 5 + 5
  })

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('SCHOOL RULES AND REGULATIONS:', 20, y)
  y += 7

  const rules = [
    'A. ATTENDANCE AND PUNCTUALITY: Students must attend all scheduled classes, lectures, and practical sessions.',
    'B. CONDUCT AND DISCIPLINE: Students must conduct themselves with dignity and respect at all times.',
    'C. DRESS CODE AND APPEARANCE: Students must dress appropriately and professionally while on campus.',
    'D. USE OF COLLEGE FACILITIES: Library, Laboratory, Computer Facilities, and Hostel rules must be followed.',
    'E. EXAMINATION REGULATIONS: Students must arrive at examination venues at least 30 minutes before scheduled time.',
    'F. HEALTH AND SAFETY: Students must comply with all health and safety regulations.',
    'G. FINANCIAL OBLIGATIONS: All fees must be paid by the due dates to avoid late payment penalties.',
    'H. COMMUNICATION: Official communications will be sent through your registered email.',
    'I. ACCOMMODATION: Hostel residents must comply with all hostel rules and regulations.',
    'J. PROFESSIONAL CONDUCT: As future healthcare professionals, you are expected to maintain high ethical standards.'
  ]

  doc.setFont('helvetica', 'normal')
  rules.forEach(rule => {
    const split = doc.splitTextToSize(rule, 170)
    doc.text(split, 25, y)
    y += split.length * 5 + 5
  })

  // Important Dates
  y += 5
  doc.setFont('helvetica', 'bold')
  doc.text('IMPORTANT DATES:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`- Orientation Date: ${orientationDate}`, 25, y)
  y += 5
  doc.text(`- Registration Deadline: ${registrationDeadline}`, 25, y)
  y += 5
  doc.text(`- First Day of Classes: ${firstDayOfClass}`, 25, y)
  y += 5
  doc.text('- Examination Period: As per academic calendar', 25, y)
  y += 10

  // Contact Information
  doc.setFont('helvetica', 'bold')
  doc.text('CONTACT INFORMATION:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text('- College Administration: admin@ccht.edu.ng', 25, y)
  y += 5
  doc.text('- Student Affairs: students@ccht.edu.ng', 25, y)
  y += 5
  doc.text('- Academic Office: academic@ccht.edu.ng', 25, y)
  y += 5
  doc.text('- Finance Department: finance@ccht.edu.ng', 25, y)
  y += 10

  // Footer
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(9)
  const footer = 'Please note that this admission is provisional and subject to verification of all submitted documents.'
  const splitFooter = doc.splitTextToSize(footer, 170)
  doc.text(splitFooter, 20, y)
  y += splitFooter.length * 5 + 10

  doc.setFont('helvetica', 'normal')
  doc.text('Congratulations on your admission. We look forward to welcoming you to Cross College of Health Technology.', 20, y)
  y += 10

  doc.setFont('helvetica', 'bold')
  doc.text('Yours faithfully,', 20, y)
  y += 10
  doc.text('The Registrar', 20, y)
  y += 5
  doc.text('Cross College of Health Technology', 20, y)

  return doc
}
