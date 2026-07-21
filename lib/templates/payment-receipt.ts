import { jsPDF } from 'jspdf'

export interface PaymentReceiptData {
  receiptId: string
  firstName: string
  lastName: string
  matricNumber: string
  program: string
  department: string
  email: string
  phone?: string
  paymentType: string
  amount: number
  reference: string
  description: string
  status: string
  paymentDate: string
  requestDate: string
  paymentMethod?: string
  currency?: string
}

export function generatePaymentReceipt(data: PaymentReceiptData): jsPDF {
  const {
    receiptId,
    firstName,
    lastName,
    matricNumber,
    program,
    department,
    email,
    phone,
    paymentType,
    amount,
    reference,
    description,
    status,
    paymentDate,
    requestDate,
    paymentMethod = 'Paystack',
    currency = 'NGN'
  } = data

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 15
  let y = margin

  // Add school logo centered at top
  try {
    const logoSize = 20
    const logoX = (pageWidth - logoSize) / 2
    doc.addImage('/images/logo.png', 'PNG', logoX, y, logoSize, logoSize)
    y += logoSize + 5
  } catch (error) {
    console.warn('Failed to load logo:', error)
    y += 5
  }

  // Header - School name
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('COVENANT COLLEGE OF', pageWidth / 2, y, { align: 'center' })
  y += 5
  doc.text('HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 8

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('OFFICIAL PAYMENT RECEIPT', pageWidth / 2, y, { align: 'center' })
  y += 10

  // Draw line separator
  doc.setDrawColor(200)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 8

  // Receipt Info Table
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  
  const tableData = [
    ['Receipt No:', receiptId, 'Date:', paymentDate],
    ['Status:', status.toUpperCase(), 'Method:', paymentMethod],
    ['Reference:', reference, 'Request Date:', requestDate]
  ]

  const labelWidth = 35
  const valueWidth = (pageWidth - 2 * margin - 2 * labelWidth) / 2
  const cellHeight = 8

  tableData.forEach((row, rowIndex) => {
    // First pair
    const x1 = margin
    const cellY = y + rowIndex * cellHeight
    
    doc.setDrawColor(200)
    doc.setLineWidth(0.3)
    doc.rect(x1, cellY, labelWidth, cellHeight)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80)
    doc.text(row[0], x1 + 3, cellY + 5)
    
    doc.rect(x1 + labelWidth, cellY, valueWidth, cellHeight)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0)
    if (row[1] === status.toUpperCase()) {
      if (status.toLowerCase() === 'success' || status.toLowerCase() === 'paid') {
        doc.setTextColor(0, 128, 0)
      } else {
        doc.setTextColor(200, 100, 0)
      }
    }
    doc.text(row[1], x1 + labelWidth + 3, cellY + 5)
    doc.setTextColor(0)
    
    // Second pair
    const x2 = x1 + labelWidth + valueWidth
    doc.rect(x2, cellY, labelWidth, cellHeight)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(80)
    doc.text(row[2], x2 + 3, cellY + 5)
    
    doc.rect(x2 + labelWidth, cellY, valueWidth, cellHeight)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0)
    doc.text(row[3], x2 + labelWidth + 3, cellY + 5)
  })

  y += tableData.length * cellHeight + 10

  // Student Information Table
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT INFORMATION', margin, y)
  y += 5

  const studentData = [
    ['Name:', `${firstName} ${lastName}`, 'Email:', email],
    ['Matric No:', matricNumber, phone ? 'Phone:' : '', phone || ''],
    ['Program:', program, '', ''],
    ['Department:', department, '', '']
  ]

  studentData.forEach((row, rowIndex) => {
    // First pair (left column)
    const x1 = margin
    const cellY = y + rowIndex * cellHeight
    
    if (row[0]) {
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.rect(x1, cellY, labelWidth, cellHeight)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80)
      doc.text(row[0], x1 + 3, cellY + 5)
    }
    
    if (row[1]) {
      doc.rect(x1 + labelWidth, cellY, valueWidth, cellHeight)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0)
      doc.text(row[1], x1 + labelWidth + 3, cellY + 5)
    }
    
    // Second pair (right column)
    const x2 = x1 + labelWidth + valueWidth
    
    if (row[2]) {
      doc.rect(x2, cellY, labelWidth, cellHeight)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80)
      doc.text(row[2], x2 + 3, cellY + 5)
    }
    
    if (row[3]) {
      doc.rect(x2 + labelWidth, cellY, valueWidth, cellHeight)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0)
      doc.text(row[3], x2 + labelWidth + 3, cellY + 5)
    }
  })

  y += studentData.length * cellHeight + 10

  // Payment Information Table
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT INFORMATION', margin, y)
  y += 5

  const paymentData = [
    ['Payment Type:', paymentType, '', ''],
    ['Description:', description, '', '']
  ]

  paymentData.forEach((row, rowIndex) => {
    // First pair (left column)
    const x1 = margin
    const cellY = y + rowIndex * cellHeight
    
    if (row[0]) {
      doc.setDrawColor(200)
      doc.setLineWidth(0.3)
      doc.rect(x1, cellY, labelWidth, cellHeight)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80)
      doc.text(row[0], x1 + 3, cellY + 5)
    }
    
    if (row[1]) {
      doc.rect(x1 + labelWidth, cellY, valueWidth, cellHeight)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0)
      doc.text(row[1], x1 + labelWidth + 3, cellY + 5)
    }
    
    // Second pair (right column) - empty for payment data
    const x2 = x1 + labelWidth + valueWidth
    
    if (row[2]) {
      doc.rect(x2, cellY, labelWidth, cellHeight)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(80)
      doc.text(row[2], x2 + 3, cellY + 5)
    }
    
    if (row[3]) {
      doc.rect(x2 + labelWidth, cellY, valueWidth, cellHeight)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(0)
      doc.text(row[3], x2 + labelWidth + 3, cellY + 5)
    }
  })

  y += paymentData.length * cellHeight + 10

  // Amount box
  doc.setDrawColor(0)
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, y, pageWidth - 2 * margin, 14, 'FD')
  y += 9
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL AMOUNT PAID', margin + 5, y)
  doc.text(`${currency} ${amount.toLocaleString()}`, pageWidth - margin - 5, y, { align: 'right' })
  y += 10

  // Payment confirmation
  const isPaid = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid'
  if (isPaid) {
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(80)
    const confirmation = 'This receipt confirms successful payment. Keep for your records.'
    doc.text(confirmation, margin, y)
    doc.setTextColor(0)
    y += 6
  }

  // Footer
  y = pageHeight - 22
  doc.setDrawColor(200)
  doc.line(margin, y, pageWidth - margin, y)
  y += 7

  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', pageWidth / 2, y, { align: 'center' })
  y += 4
  doc.setFont('helvetica', 'italic')
  doc.text('Excellence in Health Education', pageWidth / 2, y, { align: 'center' })
  y += 4
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, y, { align: 'center' })

  return doc
}
