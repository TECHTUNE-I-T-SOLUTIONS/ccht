'use client'

import { useState } from 'react'
import { SCHOOL_INFO } from '@/lib/constants'
import { format } from 'date-fns'

interface PaymentReceiptProps {
  payment: {
    id: string
    payment_type: string
    amount: number
    currency: string
    status: string
    paystack_reference: string | null
    paid_at: string | null
    created_at: string
  }
  aspirant: {
    first_name: string
    last_name: string
    email: string
    phone: string | null
  }
}

export function PaymentReceipt({ payment, aspirant }: PaymentReceiptProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownloadPDF = async () => {
    try {
      setIsLoading(true)
      
      // Dynamically import jspdf only on client side
      const jsPDF = (await import('jspdf')).default

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      })

      // Load school logo (PNG)
      const logoResponse = await fetch('/apple-icon.png')
      const logoBlob = await logoResponse.blob()
      const logoBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(logoBlob)
      })

      // Add logo
      doc.addImage(logoBase64, 'PNG', 20, 15, 20, 20)

      // School name and address
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(SCHOOL_INFO.name, 48, 22)
      
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text(SCHOOL_INFO.address || 'Nigeria', 48, 28)
      doc.text(SCHOOL_INFO.phone || '', 48, 33)

      // Receipt title
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('PAYMENT RECEIPT', 190, 22, { align: 'right' })
      
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text('Official Document', 190, 27, { align: 'right' })

      // Divider
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.8)
      doc.line(20, 42, 190, 42)

      // Receipt Details
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(20, 50, 170, 42, 4, 4, 'F')
      
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Receipt Details', 25, 60)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(107, 114, 128)
      doc.text('RECEIPT NUMBER', 25, 72)
      doc.text('PAYMENT TYPE', 25, 80)
      doc.text('DATE', 105, 72)
      doc.text('STATUS', 105, 80)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(17, 24, 39)
      doc.text(payment.paystack_reference || payment.id, 25, 76)
      doc.text(payment.payment_type, 25, 84)
      doc.text(formatDate(payment.paid_at || payment.created_at), 105, 76)
      
      // Status badge
      if (payment.status === 'success') {
        doc.setFillColor(220, 252, 231)
        doc.roundedRect(105, 83, 22, 7, 3, 3, 'F')
        doc.setTextColor(22, 101, 52)
        doc.setFontSize(7)
        doc.text(payment.status.toUpperCase(), 116, 88, { align: 'center' })
      } else {
        doc.setFillColor(254, 249, 195)
        doc.roundedRect(105, 83, 22, 7, 3, 3, 'F')
        doc.setTextColor(133, 77, 14)
        doc.setFontSize(7)
        doc.text(payment.status.toUpperCase(), 116, 88, { align: 'center' })
      }

      // Payer Information
      doc.setFillColor(249, 250, 251)
      doc.roundedRect(20, 98, 170, 38, 4, 4, 'F')
      
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Payer Information', 25, 108)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(107, 114, 128)
      doc.text('FULL NAME', 25, 120)
      doc.text('EMAIL', 25, 128)
      doc.text('PHONE', 105, 120)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(17, 24, 39)
      doc.text(`${aspirant.first_name} ${aspirant.last_name}`, 25, 124)
      doc.text(aspirant.email, 25, 132)
      doc.text(aspirant.phone || 'N/A', 105, 124)

      // Payment Amount
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(1.5)
      doc.roundedRect(20, 142, 170, 30, 4, 4, 'D')
      doc.setFillColor(239, 246, 255)
      doc.roundedRect(20, 142, 170, 30, 4, 4, 'F')
      
      doc.setTextColor(75, 85, 99)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('TOTAL AMOUNT PAID', 25, 154)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text('Including all charges', 25, 159)

      doc.setTextColor(37, 99, 235)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(formatAmount(payment.amount), 170, 157, { align: 'right' })

      // Terms
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.5)
      doc.roundedRect(20, 178, 170, 38, 4, 4, 'D')
      
      doc.setTextColor(17, 24, 39)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('Terms & Conditions', 25, 186)

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      const terms = [
        'This receipt serves as proof of payment for the specified fee.',
        'Payments are non-refundable unless otherwise stated by school policy.',
        'Keep this receipt for your records and future reference.',
        'For any inquiries, contact the finance department.'
      ]
      
      terms.forEach((term, index) => {
        doc.text(`• ${term}`, 25, 194 + (index * 6))
      })

      // Footer
      doc.setDrawColor(37, 99, 235)
      doc.setLineWidth(0.8)
      doc.line(20, 225, 190, 225)

      doc.setTextColor(17, 24, 39)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.text(SCHOOL_INFO.name, 20, 233)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(75, 85, 99)
      doc.text('Authorized by Finance Department', 20, 238)

      doc.setFontSize(8)
      doc.setTextColor(75, 85, 99)
      doc.text(`Generated on ${formatDate(new Date().toISOString())}`, 190, 233, { align: 'right' })
      doc.setTextColor(107, 114, 128)
      doc.text('This is a computer-generated receipt', 190, 238, { align: 'right' })

      // Save PDF
      doc.save(`${SCHOOL_INFO.shortName}-Receipt-${payment.payment_type.replace(/\s+/g, '-')}-${payment.paystack_reference || payment.id}.pdf`)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return format(new Date(dateString), 'MMMM dd, yyyy h:mm a')
  }

  const formatAmount = (amount: number) => {
    const currency = payment.currency || 'NGN'
    const formatted = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)
    return formatted
  }

  return (
    <button
      onClick={handleDownloadPDF}
      disabled={isLoading}
      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? 'Generating...' : 'Download Receipt'}
    </button>
  )
}
