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
  doc.text('OFFICIAL PAYMENT RECEIPT', 105, y, { align: 'center' })
  y += 15

  // Receipt Details
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('RECEIPT DETAILS:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`- Receipt ID: ${receiptId}`, 25, y)
  y += 5
  doc.text(`- Receipt Date: ${paymentDate}`, 25, y)
  y += 5
  doc.text(`- Payment Method: ${paymentMethod}`, 25, y)
  y += 10

  // Student Details
  doc.setFont('helvetica', 'bold')
  doc.text('STUDENT DETAILS:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`- Name: ${firstName} ${lastName}`, 25, y)
  y += 5
  doc.text(`- Matric Number: ${matricNumber}`, 25, y)
  y += 5
  doc.text(`- Program: ${program}`, 25, y)
  y += 5
  doc.text(`- Department: ${department}`, 25, y)
  y += 5
  doc.text(`- Email: ${email}`, 25, y)
  y += 5
  if (phone) {
    doc.text(`- Phone: ${phone}`, 25, y)
    y += 5
  }
  y += 10

  // Payment Details
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT DETAILS:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  doc.text(`- Payment Type: ${paymentType}`, 25, y)
  y += 5
  doc.text(`- Description: ${description}`, 25, y)
  y += 5
  doc.text(`- Amount: ${currency} ${amount.toLocaleString()}`, 25, y)
  y += 5
  doc.text(`- Reference: ${reference}`, 25, y)
  y += 5
  doc.text(`- Status: ${status.toUpperCase()}`, 25, y)
  y += 5
  doc.text(`- Request Date: ${requestDate}`, 25, y)
  y += 10

  // Payment Confirmation
  const isPaid = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid'
  if (isPaid) {
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT CONFIRMATION:', 20, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    const confirmation = 'This receipt confirms that the payment has been successfully received and processed by Covenant College of Health Technology. This document serves as official proof of payment for the stated amount and may be used for all official college purposes.'
    const splitConfirmation = doc.splitTextToSize(confirmation, 170)
    addPageIfNeeded(splitConfirmation.length * lineHeight + 10)
    doc.text(splitConfirmation, 25, y)
    y += splitConfirmation.length * lineHeight + 10

    doc.setFont('helvetica', 'bold')
    doc.text('VERIFICATION DETAILS:', 20, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.text(`- Transaction Reference: ${reference}`, 25, y)
    y += 5
    doc.text(`- Payment Date: ${paymentDate}`, 25, y)
    y += 10
  } else {
    doc.setFont('helvetica', 'bold')
    doc.text('PAYMENT STATUS:', 20, y)
    y += 7
    doc.setFont('helvetica', 'normal')
    doc.text(`Status: ${status.toUpperCase()}`, 25, y)
    y += 5
    const pendingText = 'This payment is currently pending. Please complete the payment process to receive a confirmed receipt. Contact the finance department if you have any questions.'
    const splitPending = doc.splitTextToSize(pendingText, 170)
    addPageIfNeeded(splitPending.length * lineHeight + 10)
    doc.text(splitPending, 25, y)
    y += splitPending.length * lineHeight + 10
  }

  // Important Notes
  addPageIfNeeded(20)
  doc.setFont('helvetica', 'bold')
  doc.text('IMPORTANT NOTES:', 20, y)
  y += 7
  doc.setFont('helvetica', 'normal')
  const notes = [
    '1. Keep this receipt for your records.',
    '2. Present this receipt for any payment-related inquiries.',
    '3. This receipt is valid for official college purposes.',
    '4. Regularly check your student portal for payment updates.',
    '5. Contact the finance department if you have any questions about your payment.'
  ]
  notes.forEach(note => {
    doc.text(note, 25, y)
    y += 5
  })
  y += 10

  // Footer
  addPageIfNeeded(20)
  doc.setFont('helvetica', 'bold')
  doc.text('COVENANT COLLEGE OF HEALTH TECHNOLOGY', 20, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.text('Excellence in Health Education', 20, y)
  y += 10
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8)
  doc.text('This is a computer-generated receipt. No signature required.', 20, y)
  y += 5
  doc.text(`Generated on: ${new Date().toISOString()}`, 20, y)
  y += 5
  doc.text('System: Covenant College of Health Technology Payment System', 20, y)
  y += 5
  doc.text('Version: 1.0', 20, y)

  return doc
}
