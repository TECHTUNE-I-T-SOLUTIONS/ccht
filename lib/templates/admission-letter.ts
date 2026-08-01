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
  const pageHeight = doc.internal.pageSize.height
  const pageWidth = doc.internal.pageSize.width
  const margin = 15
  const lineHeight = 5
  let y = margin

  const addPageIfNeeded = (additionalSpace = 20) => {
    if (y + additionalSpace > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Draw decorative border
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.5)
  doc.line(margin, margin, pageWidth - margin, margin)
  doc.line(margin, pageHeight - margin, pageWidth - margin, pageHeight - margin)

  // Add school logo centered at top
  try {
    const logoWidth = 40
    const logoX = (pageWidth - logoWidth) / 2
    doc.addImage('/images/logo.png', 'PNG', logoX, y + 5, logoWidth, 40)
    y += 50
  } catch (error) {
    console.warn('Failed to load logo:', error)
  }

  // Header - Letterhead style
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Excellence in Health Education | Training Future Healthcare Leaders', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.text('Accredited by the National Board for Technical Education (NBTE)', pageWidth / 2, y, { align: 'center' })
  y += 10

  // Decorative line
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.3)
  doc.line(margin + 10, y, pageWidth - margin - 10, y)
  y += 10

  // Document title
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('OFFICIAL ADMISSION LETTER', pageWidth / 2, y, { align: 'center' })
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Reference: CCHT/ADM/' + new Date().getFullYear() + '/' + matricNumber.split('/').pop(), pageWidth / 2, y, { align: 'center' })
  y += 10

  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Date: ${admissionDate}`, pageWidth - margin, y, { align: 'right' })
  y += 12

  // Salutation
  doc.setFontSize(11)
  doc.text(`Dear ${firstName} ${lastName},`, margin, y)
  y += 10

  // Subject
  doc.setFont('helvetica', 'bold')
  doc.text(`RE: ADMISSION INTO ${program.toUpperCase()} PROGRAM`, margin, y)
  y += 10

  // Opening paragraph
  doc.setFont('helvetica', 'normal')
  const openingText = `We are delighted to inform you that you have been offered provisional admission into the ${program} program at Covenant College of Health Technology for the ${new Date().getFullYear()}/${new Date().getFullYear() + 1} academic session. This admission is based on your satisfactory performance in the entrance examination and meeting all admission requirements.`
  const splitOpening = doc.splitTextToSize(openingText, pageWidth - 2 * margin)
  addPageIfNeeded(splitOpening.length * lineHeight + 10)
  doc.text(splitOpening, margin, y)
  y += splitOpening.length * lineHeight + 10

  // Admission Details Box
  addPageIfNeeded(60)
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - 2 * margin, 45)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('ADMISSION DETAILS ', margin + 5, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
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
    const xPos = index % 2 === 0 ? margin + 10 : pageWidth / 2 + 5
    const yPos = y + Math.floor(index / 2) * 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(detail.label, xPos, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(detail.value, xPos + 30, yPos)
  })
  y += 28

  // Conditions for Admission
  addPageIfNeeded(30)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CONDITIONS FOR ADMISSION', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const conditions = [
    '1. PAYMENT OF ACCEPTANCE AND TUITION FEES: All required fees must be paid within the stipulated period as indicated in the fee schedule. Failure to pay fees by the deadline may result in the withdrawal of this admission offer.',
    '2. COMPLETION OF REGISTRATION: You must complete all registration formalities, including medical screening, biometric capture, and document verification, within the first two weeks of the academic session.',
    '3. SUBMISSION OF REQUIRED DOCUMENTS: Original copies of all submitted documents (O\'Level results, birth certificate, passport photographs, etc.) must be presented for verification during registration.',
    '4. MEDICAL FITNESS CERTIFICATE: A medical fitness certificate from a government-approved hospital must be submitted during registration.',
    '5. ACADEMIC PERFORMANCE: You are expected to maintain satisfactory academic progress throughout your program. A minimum CGPA of 2.0 is required to remain in good academic standing.',
    '6. ATTENDANCE REQUIREMENT: You must maintain a minimum of 75% attendance in all courses to be eligible for examinations.',
    '7. CODE OF CONDUCT: You must adhere strictly to the college code of conduct and all rules and regulations as outlined in the student handbook.'
  ]

  conditions.forEach(condition => {
    const split = doc.splitTextToSize(condition, pageWidth - 2 * margin - 10)
    addPageIfNeeded(split.length * lineHeight + 5)
    doc.text(split, margin + 5, y)
    y += split.length * lineHeight + 5
  })

  y += 5
  addPageIfNeeded(30)

  // School Rules and Regulations - Comprehensive
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SCHOOL RULES AND REGULATIONS', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const rules = [
    'A. ATTENDANCE AND PUNCTUALITY: Students must attend all scheduled classes, lectures, practical sessions, and clinical rotations. Late arrival to classes (more than 15 minutes) will be recorded as absence. Three consecutive absences without valid reason may lead to disciplinary action.',
    'B. ACADEMIC INTEGRITY: Any form of cheating, plagiarism, falsification of records, or examination malpractice is strictly prohibited and will result in immediate suspension or expulsion.',
    'C. CONDUCT AND DISCIPLINE: Students must conduct themselves with dignity, respect, and professionalism at all times. Physical or verbal abuse, fighting, harassment, or any form of misconduct will attract severe disciplinary measures.',
    'D. DRESS CODE AND APPEARANCE: Students must dress appropriately and professionally while on campus. Clinical attire (white coat/uniform) must be worn during clinical rotations. Revealing or inappropriate clothing is prohibited.',
    'E. USE OF COLLEGE FACILITIES: Library books must be returned on time. Laboratory equipment must be handled with care. Computer facilities are for academic purposes only. Hostel residents must comply with all hostel rules including quiet hours and visitor policies.',
    'F. EXAMINATION REGULATIONS: Students must arrive at examination venues at least 30 minutes before scheduled time. No student will be admitted 30 minutes after the commencement of any examination. Only authorized materials are allowed in examination halls.',
    'G. HEALTH AND SAFETY: Students must comply with all health and safety regulations, especially during laboratory and clinical sessions. Use of personal protective equipment (PPE) is mandatory in clinical areas.',
    'H. FINANCIAL OBLIGATIONS: All fees must be paid by the due dates to avoid late payment penalties. Students with outstanding fees may be denied examination privileges and access to college facilities.',
    'I. COMMUNICATION: Official communications will be sent through your registered email and student portal. Students are expected to check their email regularly. The college is not responsible for missed communications due to incorrect contact information.',
    'J. PROHIBITED ITEMS: The use of alcohol, illegal drugs, weapons, or any prohibited substances on campus is strictly forbidden and will result in immediate expulsion and possible legal action.',
    'K. SOCIAL MEDIA CONDUCT: Students must not post derogatory, defamatory, or inappropriate content about the college, staff, or fellow students on social media platforms.',
    'L. PROFESSIONAL CONDUCT: As future healthcare professionals, you are expected to maintain high ethical standards, patient confidentiality, and professional boundaries at all times.'
  ]

  rules.forEach(rule => {
    const split = doc.splitTextToSize(rule, pageWidth - 2 * margin - 10)
    addPageIfNeeded(split.length * lineHeight + 5)
    doc.text(split, margin + 5, y)
    y += split.length * lineHeight + 5
  })

  y += 5
  addPageIfNeeded(30)

  // Important Dates
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('IMPORTANT DATES AND DEADLINES', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const dates = [
    { label: 'Orientation Program:', value: orientationDate },
    { label: 'Registration Deadline:', value: registrationDeadline },
    { label: 'First Day of Classes:', value: firstDayOfClass },
    { label: 'Late Registration Ends:', value: 'Two weeks after registration deadline' },
    { label: 'First Semester Examination:', value: 'As per academic calendar' },
    { label: 'Second Semester Begins:', value: 'As per academic calendar' }
  ]

  dates.forEach(date => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(date.label, margin + 5, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(date.value, margin + 60, y)
    y += 5
  })

  y += 8
  addPageIfNeeded(30)

  // Fee Information
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('FEE INFORMATION', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const feeInfo = [
    'Detailed fee schedules are available at the finance department and on the student portal.',
    'Fees may be paid in installments as per the college policy. However, at least 60% of total fees must be paid before the first semester examination.',
    'Payment can be made through bank transfer, POS, or at designated bank branches. Receipts must be obtained and kept for all payments.',
    'Late payment attracts a penalty of 10% of the outstanding amount per month.',
    'Students who fail to pay fees by the examination deadline will not be allowed to sit for examinations.'
  ]

  feeInfo.forEach(info => {
    const split = doc.splitTextToSize(info, pageWidth - 2 * margin - 10)
    addPageIfNeeded(split.length * lineHeight + 5)
    doc.text(split, margin + 5, y)
    y += split.length * lineHeight + 5
  })

  y += 5
  addPageIfNeeded(30)

  // Contact Information
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('CONTACT INFORMATION', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const contacts = [
    { label: 'College Email:', value: 'info@covenantcollegeofhealthtech.com.ng' },
    { label: 'College Phone:', value: '+2347066369818' },
    { label: 'College Website:', value: 'https://www.covenantcollegeofhealthtech.com.ng' },
    { label: 'College Address:', value: 'Opposite NUD Primary school, Ogbomoso-Ilorin, Old Express Road, Orile-Igbon, Oyo State, Nigeria' }
  ]

  contacts.forEach(contact => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(contact.label, margin + 5, y)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    const splitValue = doc.splitTextToSize(contact.value, pageWidth - margin - 70)
    doc.text(splitValue, margin + 55, y)
    y += splitValue.length * 5 + 4
  })

  y += 10
  addPageIfNeeded(40)

  // Important Notice
  doc.setDrawColor(255, 0, 0)
  doc.setLineWidth(0.5)
  doc.rect(margin, y, pageWidth - 2 * margin, 25)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(255, 0, 0)
  doc.text('IMPORTANT NOTICE', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setTextColor(0, 0, 0)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const notice = 'This admission is provisional and subject to verification of all submitted documents. Any false information provided may result in immediate withdrawal of admission. The college reserves the right to withdraw this admission if any admission requirement is not met.'
  const splitNotice = doc.splitTextToSize(notice, pageWidth - 2 * margin - 10)
  doc.text(splitNotice, margin + 5, y)
  y += splitNotice.length * lineHeight + 10

  // Congratulations and Closing
  addPageIfNeeded(30)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const congrats = 'Congratulations on your admission to Covenant College of Health Technology. We look forward to welcoming you to our community of future healthcare professionals. We are committed to providing you with quality education and training that will prepare you for a successful career in the healthcare industry.'
  const splitCongrats = doc.splitTextToSize(congrats, pageWidth - 2 * margin)
  addPageIfNeeded(splitCongrats.length * lineHeight + 10)
  doc.text(splitCongrats, margin, y)
  y += splitCongrats.length * lineHeight + 15

  // Signature Section
  doc.setFont('helvetica', 'bold')
  doc.text('Yours faithfully,', margin, y)
  y += 15
  doc.text('The Registrar', margin, y)
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.text('Covenant College of Health Technology', margin, y)
  y += 10

  // Signature line
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(margin, y, margin + 50, y)
  y += 5
  doc.setFontSize(8)
  doc.text('Signature & Date', margin, y)

  // Footer
  y = pageHeight - 20
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('This document is official and confidential. For inquiries, contact students@ccht.edu.ng', pageWidth / 2, y, { align: 'center' })
  doc.text('Covenant College of Health Technology - Excellence in Health Education', pageWidth / 2, y + 5, { align: 'center' })

  return doc
}
