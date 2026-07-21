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
  const margin = 20
  const lineHeight = 5
  let y = margin

  const addPageIfNeeded = (additionalSpace = 20) => {
    if (y + additionalSpace > pageHeight - margin) {
      doc.addPage()
      y = margin
    }
  }

  // Add school logo
  try {
    doc.addImage('/images/logo.png', 'PNG', margin, y, 30, 30)
    y += 35
  } catch (error) {
    // If logo fails to load, continue without it
    console.warn('Failed to load logo:', error)
  }

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', 105, y, { align: 'center' })
  y += 10
  doc.setFontSize(14)
  doc.text('SCHOOL OATH FORM AND AGREEMENT', 105, y, { align: 'center' })
  y += 15

  // Date
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(oathDate, 105, y, { align: 'center' })
  y += 15

  // Title
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT OATH AND PROFESSIONAL AGREEMENT', 20, y)
  y += 10

  // Preamble
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const preamble = `I, ${firstName} ${lastName}, with Matric Number ${matricNumber}, enrolled in the ${program} program, Department of ${department}, hereby solemnly declare and agree as follows:`
  const splitPreamble = doc.splitTextToSize(preamble, 170)
  addPageIfNeeded(splitPreamble.length * lineHeight + 10)
  doc.text(splitPreamble, 20, y)
  y += splitPreamble.length * lineHeight + 10

  // Sections
  const sections = [
    {
      title: 'ACADEMIC INTEGRITY OATH',
      items: [
        'I pledge to maintain absolute honesty in all academic endeavors. I will not engage in any form of cheating, plagiarism, or academic dishonesty.',
        'I will complete all assignments, examinations, and projects on my own unless collaboration is explicitly authorized by the instructor.',
        'I will properly cite all sources and give credit to the original authors of any work that I reference.',
        'I will not use unauthorized materials during examinations or assessments.',
        'I will not assist others in academic dishonesty or allow my work to be used for cheating.'
      ]
    },
    {
      title: 'ATTENDANCE AND PARTICIPATION OATH',
      items: [
        'I commit to attending all classes, lectures, practical sessions, and clinical rotations regularly and punctually.',
        'I will maintain the required attendance percentage as specified in the student handbook.',
        'I will notify my instructors in advance if I must miss a class due to illness or emergency.',
        'I will make up all missed work within the timeframe specified by my instructors.',
        'I understand that poor attendance may result in academic penalties or dismissal from the program.'
      ]
    },
    {
      title: 'PROFESSIONAL CONDUCT OATH',
      items: [
        'I agree to conduct myself with dignity, respect, and professionalism at all times, both on and off campus.',
        'I will treat all college staff, fellow students, patients, and clinical staff with respect and courtesy.',
        'I will not engage in any form of physical or verbal abuse, harassment, or discrimination.',
        'I will maintain appropriate professional boundaries with patients, colleagues, and instructors.',
        'I will dress appropriately and professionally as required by the college dress code.'
      ]
    },
    {
      title: 'HEALTHCARE ETHICS OATH',
      items: [
        'I pledge to maintain the highest ethical standards as a future healthcare professional.',
        'I will strictly observe patient confidentiality and privacy at all times.',
        'I will obtain informed consent before performing any procedure on a patient.',
        'I will provide care to all patients without discrimination.',
        'I will practice within the scope of my training and seek guidance when uncertain.'
      ]
    },
    {
      title: 'HEALTH AND SAFETY OATH',
      items: [
        'I will comply with all health and safety regulations, especially during clinical sessions.',
        'I will wear required personal protective equipment (PPE) at all times as specified.',
        'I will follow proper infection control procedures to prevent the spread of infections.',
        'I will report any injuries, accidents, or exposures immediately.',
        'I will not come to class or clinical settings if I am contagious or ill.'
      ]
    },
    {
      title: 'FINANCIAL OBLIGATIONS OATH',
      items: [
        'I will pay all required fees by the stipulated deadlines.',
        'I understand that failure to pay fees may result in penalties or denial of examination privileges.',
        'I will keep all payment receipts for my records.',
        'I will promptly report any financial difficulties to the finance department.'
      ]
    }
  ]

  sections.forEach(section => {
    addPageIfNeeded(20)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(section.title, 20, y)
    y += 7

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    section.items.forEach(item => {
      const split = doc.splitTextToSize(item, 170)
      addPageIfNeeded(split.length * lineHeight + 3)
      doc.text(split, 25, y)
      y += split.length * lineHeight + 3
    })
    y += 5
  })

  // Declaration
  addPageIfNeeded(20)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('DECLARATION AND SIGNATURE:', 20, y)
  y += 7

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const declaration = 'I hereby declare that I have read, understood, and agree to abide by all the rules, regulations, and guidelines of Covenant College of Health Technology as outlined in this oath.'
  const splitDeclaration = doc.splitTextToSize(declaration, 170)
  addPageIfNeeded(splitDeclaration.length * lineHeight + 10)
  doc.text(splitDeclaration, 20, y)
  y += splitDeclaration.length * lineHeight + 10

  // Student Info
  doc.setFont('helvetica', 'bold')
  doc.text(`Student Name: ${firstName} ${lastName}`, 20, y)
  y += 5
  doc.text(`Matric Number: ${matricNumber}`, 20, y)
  y += 5
  doc.text(`Program: ${program}`, 20, y)
  y += 5
  doc.text(`Department: ${department}`, 20, y)
  y += 10

  // Signature lines
  doc.setFont('helvetica', 'normal')
  doc.text('Student Signature: ______________________', 20, y)
  y += 10
  doc.text(`Date: ${oathDate}`, 20, y)
  y += 15

  doc.text('Witness Name: ______________________', 20, y)
  y += 10
  doc.text('Witness Signature: ______________________', 20, y)
  y += 10
  doc.text(`Date: ${oathDate}`, 20, y)
  y += 15

  // Footer
  addPageIfNeeded(20)
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('This document is official and confidential. Any unauthorized reproduction or distribution is prohibited.', 20, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY - Excellence in Health Education', 20, y)
  y += 10
  doc.text('For any clarifications, contact: students@ccht.edu.ng', 20, y)

  return doc
}
