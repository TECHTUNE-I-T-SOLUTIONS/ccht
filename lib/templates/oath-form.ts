import { jsPDF } from 'jspdf'

export interface OathFormData {
  firstName: string
  lastName: string
  matricNumber: string
  program: string
  department: string
  oathDate: string
}

export function generateOathForm(data: OathFormData): jsPDF {
  const {
    firstName,
    lastName,
    matricNumber,
    program,
    department,
    oathDate
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
  doc.text('SCHOOL OATH FORM AND PROFESSIONAL AGREEMENT', pageWidth / 2, y, { align: 'center' })
  y += 8
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Reference: CCHT/OATH/' + new Date().getFullYear() + '/' + matricNumber.split('/').pop(), pageWidth / 2, y, { align: 'center' })
  y += 10

  // Date
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Date: ${oathDate}`, pageWidth - margin, y, { align: 'right' })
  y += 12

  // Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT OATH AND PROFESSIONAL CONDUCT AGREEMENT', margin, y)
  y += 10

  // Preamble
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const preamble = `I, ${firstName} ${lastName}, with Matric Number ${matricNumber}, enrolled in the ${program} program, Department of ${department}, hereby solemnly declare and agree to abide by all the rules, regulations, and ethical standards of Covenant College of Health Technology as outlined below:`
  const splitPreamble = doc.splitTextToSize(preamble, pageWidth - 2 * margin)
  addPageIfNeeded(splitPreamble.length * lineHeight + 10)
  doc.text(splitPreamble, margin, y)
  y += splitPreamble.length * lineHeight + 10

  // Sections - Comprehensive
  const sections = [
    {
      title: 'I. ACADEMIC INTEGRITY OATH',
      items: [
        'I pledge to maintain absolute honesty and integrity in all academic endeavors. I will not engage in any form of cheating, plagiarism, falsification of data, or academic dishonesty.',
        'I will complete all assignments, examinations, projects, and research work on my own unless collaboration is explicitly authorized by the instructor.',
        'I will properly cite all sources, references, and give appropriate credit to the original authors of any work that I reference or use.',
        'I will not use unauthorized materials, notes, electronic devices, or any form of assistance during examinations or assessments unless explicitly permitted.',
        'I will not assist others in academic dishonesty or allow my work to be used for cheating by other students.',
        'I will report any instances of academic dishonesty that I witness to the appropriate authorities.'
      ]
    },
    {
      title: 'II. ATTENDANCE AND PARTICIPATION OATH',
      items: [
        'I commit to attending all classes, lectures, practical sessions, laboratory work, and clinical rotations regularly and punctually.',
        'I will maintain the required minimum attendance percentage of 75% as specified in the student handbook to be eligible for examinations.',
        'I will notify my instructors or department head in advance if I must miss a class due to illness, emergency, or other valid reasons.',
        'I will make up all missed work, assignments, and examinations within the timeframe specified by my instructors.',
        'I understand that poor attendance, habitual lateness, or unauthorized absence may result in academic penalties, grade reduction, or dismissal from the program.',
        'I will actively participate in class discussions, group activities, and clinical learning experiences.'
      ]
    },
    {
      title: 'III. PROFESSIONAL CONDUCT OATH',
      items: [
        'I agree to conduct myself with dignity, respect, professionalism, and ethical behavior at all times, both on and off campus.',
        'I will treat all college staff, faculty, fellow students, patients, clinical staff, and visitors with respect, courtesy, and professionalism.',
        'I will not engage in any form of physical or verbal abuse, harassment, bullying, discrimination, or any form of misconduct.',
        'I will maintain appropriate professional boundaries with patients, colleagues, instructors, and all individuals I interact with during clinical rotations.',
        'I will dress appropriately and professionally as required by the college dress code, including wearing clinical attire (white coat/uniform) during clinical rotations.',
        'I will not use profane, abusive, or disrespectful language in any setting.',
        'I will respect the privacy and dignity of all individuals at all times.'
      ]
    },
    {
      title: 'IV. HEALTHCARE ETHICS OATH',
      items: [
        'I pledge to maintain the highest ethical standards as a future healthcare professional, upholding the sanctity of human life and dignity.',
        'I will strictly observe patient confidentiality and privacy at all times, in accordance with professional ethics and legal requirements.',
        'I will obtain informed consent before performing any procedure, examination, or intervention on a patient.',
        'I will provide care to all patients without discrimination based on race, ethnicity, religion, gender, age, socioeconomic status, or medical condition.',
        'I will practice within the scope of my training and competence, seeking guidance and supervision when uncertain or beyond my capabilities.',
        'I will report any unethical practices, patient safety concerns, or professional misconduct to appropriate authorities.',
        'I will maintain accurate and complete patient records and documentation.'
      ]
    },
    {
      title: 'V. HEALTH AND SAFETY OATH',
      items: [
        'I will comply with all health and safety regulations, protocols, and guidelines, especially during laboratory sessions and clinical rotations.',
        'I will wear required personal protective equipment (PPE) including gloves, masks, gowns, and other protective gear at all times as specified.',
        'I will follow proper infection control procedures, hand hygiene protocols, and sterilization techniques to prevent the spread of infections.',
        'I will report any injuries, accidents, exposures, needle sticks, or safety incidents immediately to the appropriate supervisor.',
        'I will not come to class, laboratory, or clinical settings if I am contagious, ill, or have symptoms of infectious disease.',
        'I will properly handle, store, and dispose of hazardous materials, chemicals, and biohazard waste according to safety protocols.',
        'I will participate in all mandatory health screenings, vaccinations, and medical examinations as required by the college.'
      ]
    },
    {
      title: 'VI. FINANCIAL OBLIGATIONS OATH',
      items: [
        'I will pay all required fees, including tuition, accommodation, laboratory fees, and other charges by the stipulated deadlines.',
        'I understand that failure to pay fees by the due dates may result in late payment penalties, denial of examination privileges, or access restrictions.',
        'I will keep all payment receipts, transaction records, and financial documents for my records and present them when required.',
        'I will promptly report any financial difficulties, payment issues, or requests for fee restructuring to the finance department.',
        'I will not engage in any fraudulent financial activities or provide false information to obtain financial benefits.'
      ]
    },
    {
      title: 'VII. COLLEGE FACILITIES AND PROPERTY OATH',
      items: [
        'I will treat all college property, including equipment, furniture, books, laboratory instruments, and facilities with care and respect.',
        'I will not damage, vandalize, steal, or misuse any college property or the property of others.',
        'I will return all borrowed materials, library books, and equipment on or before the due date.',
        'I will keep my living space (if residing in the hostel) clean, hygienic, and in accordance with hostel regulations.',
        'I will not remove any college property from the premises without proper authorization.',
        'I will report any damage to college property or facilities immediately to the appropriate authorities.'
      ]
    },
    {
      title: 'VIII. COMMUNICATION AND INFORMATION TECHNOLOGY OATH',
      items: [
        'I will check my registered email and student portal regularly for official communications and announcements.',
        'I will maintain updated contact information and notify the college of any changes to my contact details.',
        'I will use college computer facilities, internet access, and digital resources for academic purposes only.',
        'I will not access, download, or distribute inappropriate, illegal, or copyrighted materials without authorization.',
        'I will not engage in cyberbullying, online harassment, or inappropriate use of social media platforms.',
        'I will not post derogatory, defamatory, or inappropriate content about the college, staff, or fellow students on any platform.',
        'I will protect my login credentials and not share my password or account access with anyone.'
      ]
    },
    {
      title: 'IX. PROHIBITED CONDUCT OATH',
      items: [
        'I will not consume, possess, distribute, or be under the influence of alcohol, illegal drugs, or controlled substances on campus.',
        'I will not possess, use, or threaten to use any weapons, dangerous objects, or prohibited items on college premises.',
        'I will not engage in gambling, betting, or any form of illegal activities on campus.',
        'I will not participate in cultism, secret societies, or any unauthorized organizations.',
        'I will not engage in examination malpractice, impersonation, or any form of academic fraud.',
        'I will not engage in sexual harassment, assault, or any form of sexual misconduct.',
        'I understand that violation of these prohibitions may result in immediate expulsion and possible legal action.'
      ]
    },
    {
      title: 'X. LEGAL AND DISCIPLINARY OATH',
      items: [
        'I understand that violation of any of these oaths, rules, or regulations may result in disciplinary action.',
        'Disciplinary actions may include warnings, probation, suspension, expulsion, or legal proceedings depending on the severity of the violation.',
        'I have the right to appeal any disciplinary decision through the established college appeals process.',
        'I agree to cooperate fully with any investigation into alleged violations of this oath or college regulations.',
        'I understand that this oath is binding throughout my enrollment and may extend to my professional conduct after graduation.'
      ]
    }
  ]

  sections.forEach(section => {
    addPageIfNeeded(25)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(section.title, margin, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    section.items.forEach(item => {
      const split = doc.splitTextToSize(item, pageWidth - 2 * margin - 10)
      addPageIfNeeded(split.length * lineHeight + 3)
      doc.text(split, margin + 5, y)
      y += split.length * lineHeight + 3
    })
    y += 5
  })

  y += 5
  addPageIfNeeded(30)

  // Declaration
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - 2 * margin, 30)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('DECLARATION AND ACKNOWLEDGMENT', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  const declaration = 'I hereby declare that I have read, understood, and agree to abide by all the rules, regulations, oaths, and guidelines of Covenant College of Health Technology as outlined in this document. I understand that this is a binding agreement and that violation of any provision may result in disciplinary action, including expulsion from the college.'
  const splitDeclaration = doc.splitTextToSize(declaration, pageWidth - 2 * margin - 10)
  addPageIfNeeded(splitDeclaration.length * lineHeight + 10)
  doc.text(splitDeclaration, margin + 5, y)
  y += splitDeclaration.length * lineHeight + 10

  // Student Info Box
  addPageIfNeeded(40)
  doc.setDrawColor(0, 102, 204)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, pageWidth - 2 * margin, 35)
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('STUDENT INFORMATION', pageWidth / 2, y, { align: 'center' })
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const studentInfo = [
    { label: 'Student Name:', value: `${firstName} ${lastName}` },
    { label: 'Matric Number:', value: matricNumber },
    { label: 'Program:', value: program },
    { label: 'Department:', value: department },
    { label: 'Date:', value: oathDate }
  ]

  studentInfo.forEach((info, index) => {
    const xPos = index % 2 === 0 ? margin + 10 : pageWidth / 2 + 5
    const yPos = y + Math.floor(index / 2) * 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text(info.label, xPos, yPos)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(info.value, xPos + 30, yPos)
  })
  y += 22

  // Signature Section
  addPageIfNeeded(50)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('SIGNATURE SECTION', margin, y)
  y += 10

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)

  // Student Signature
  doc.text('Student Signature:', margin, y)
  y += 8
  doc.setDrawColor(0, 0, 0)
  doc.setLineWidth(0.3)
  doc.line(margin, y, margin + 60, y)
  y += 5
  doc.text('Date:', margin, y)
  doc.line(margin + 15, y, margin + 50, y)
  y += 10

  // Witness Signature
  doc.text('Witness Name:', margin, y)
  doc.line(margin + 40, y, margin + 100, y)
  y += 8
  doc.text('Witness Signature:', margin, y)
  y += 8
  doc.line(margin, y, margin + 60, y)
  y += 5
  doc.text('Date:', margin, y)
  doc.line(margin + 15, y, margin + 50, y)
  y += 10

  // College Representative
  doc.text('College Representative:', margin, y)
  doc.line(margin + 55, y, margin + 100, y)
  y += 8
  doc.text('Signature:', margin, y)
  y += 8
  doc.line(margin, y, margin + 60, y)
  y += 5
  doc.text('Date:', margin, y)
  doc.line(margin + 15, y, margin + 50, y)
  y += 10

  // Important Notice
  addPageIfNeeded(30)
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
  doc.setFontSize(8)
  const notice = 'This document is a legally binding agreement. By signing this oath, you acknowledge your understanding and acceptance of all terms and conditions outlined herein. Any false information provided or violation of these terms may result in disciplinary action and possible legal consequences.'
  const splitNotice = doc.splitTextToSize(notice, pageWidth - 2 * margin - 10)
  doc.text(splitNotice, margin + 5, y)
  y += splitNotice.length * lineHeight + 10

  // Footer
  y = pageHeight - 25
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.setTextColor(100, 100, 100)
  doc.text('This document is official and confidential. Any unauthorized reproduction or distribution is prohibited.', pageWidth / 2, y, { align: 'center' })
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY - Excellence in Health Education', pageWidth / 2, y + 5, { align: 'center' })
  doc.text('For any clarifications, contact: info@covenantcollegeofhealthtech.com.ng | +2347066369818', pageWidth / 2, y + 10, { align: 'center' })

  return doc
}
