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

export function generatePaymentReceipt(data: PaymentReceiptData): string {
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

  const isPaid = status.toLowerCase() === 'success' || status.toLowerCase() === 'paid'

  return `
CROSS COLLEGE OF HEALTH TECHNOLOGY
OFFICIAL PAYMENT RECEIPT

RECEIPT DETAILS:
- Receipt ID: ${receiptId}
- Receipt Date: ${paymentDate}
- Request Date: ${requestDate}

STUDENT INFORMATION:
- Name: ${firstName} ${lastName}
- Matric Number: ${matricNumber}
- Program: ${program}
- Department: ${department}
- Email: ${email}
- Phone: ${phone || 'N/A'}

PAYMENT INFORMATION:
- Payment Type: ${paymentType.toUpperCase()}
- Amount: ${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Reference Number: ${reference}
- Description: ${description}
- Payment Method: ${paymentMethod}
- Payment Status: ${status.toUpperCase()}
- Payment Date: ${paymentDate}

PAYMENT BREAKDOWN:
- Subtotal: ${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
- Processing Fee: ${currency} 0.00
- Total: ${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

PAYMENT STATUS: ${status.toUpperCase()}

${isPaid ? `
PAYMENT CONFIRMATION:

This receipt confirms that the payment has been successfully received and processed by Cross College of Health Technology. This document serves as official proof of payment for the stated amount and may be used for all official college purposes.

VERIFICATION DETAILS:
- Transaction Reference: ${reference}
- Processing Date: ${paymentDate}
- Confirmation Status: VERIFIED
- Receipt Validity: VALID

IMPORTANT NOTES:
1. Please keep this receipt for your records.
2. This receipt is required for registration and examination purposes.
3. For any inquiries regarding this payment, contact the finance department.
4. This receipt is valid for all official college purposes.
5. Duplicate receipts may be issued upon request with valid identification.
6. This receipt is non-transferable and valid only for the named student.

REFUND POLICY:
- Refund requests must be submitted in writing to the finance department.
- Refund requests will be reviewed on a case-by-case basis.
- Administrative fees may be deducted from approved refunds.
- Processing time for refunds may take up to 30 business days.
- Refund requests must be made within 90 days of payment.

DISPUTE RESOLUTION:
- If you believe there is an error in this receipt, contact the finance department within 30 days.
- Provide your receipt ID and reference number for faster resolution.
- Disputes will be investigated and resolved within 15 business days.
- The college reserves the right to verify payment details before issuing corrections.
` : `
PAYMENT STATUS NOTICE:

This payment is currently ${status.toUpperCase()}. Once processed, a final receipt will be generated and made available through the student portal.

NEXT STEPS:
1. If payment is pending, please wait for processing to complete.
2. If payment failed, please contact the finance department for assistance.
3. If payment was abandoned, you may initiate a new payment through the student portal.
4. For payment status inquiries, please contact the finance department.

CONTACT FOR ASSISTANCE:
- Finance Department: finance@ccht.edu.ng
- Student Affairs: students@ccht.edu.ng
- College Administration: admin@ccht.edu.ng

Please have your reference number (${reference}) ready when contacting the finance department.
`}

FEE STRUCTURE REFERENCE:

Application Fee: ${currency} 6,500.00
Admission Fee: ${currency} 30,000.00
Tuition Fee: As per program schedule
Laboratory Fee: As per program schedule
Library Fee: As per program schedule
Examination Fee: As per program schedule
Other Fees: As per program schedule

For detailed fee information, please refer to the current fee schedule available at the finance department or on the college portal.

TERMS AND CONDITIONS:

1. RECEIPT VALIDITY:
   - This receipt is valid only for the academic session indicated.
   - This receipt is non-transferable and cannot be used by another student.
   - This receipt must be presented for verification when requested.

2. PAYMENT VERIFICATION:
   - The college reserves the right to verify payment details at any time.
   - Students must provide original payment receipts for verification.
   - Fraudulent receipts will result in disciplinary action.

3. DISCREPANCIES:
   - Any discrepancies in this receipt must be reported to the finance department within 30 days.
   - Corrections will be made after verification of payment records.
   - The college is not liable for errors after the 30-day period.

4. DUPLICATE RECEIPTS:
   - Duplicate receipts may be issued upon request with valid identification.
   - A processing fee may apply for duplicate receipts.
   - Duplicate receipts will be marked as "DUPLICATE" and will have the same validity as the original.

5. PAYMENT METHODS:
   - Payments can be made through Paystack, bank transfer, or cash at designated banks.
   - Online payments are processed securely through Paystack.
   - Bank transfer details are available on the college portal.
   - Cash payments must be made at designated bank branches only.

6. LATE PAYMENTS:
   - Late payment penalties may apply for payments made after the deadline.
   - Students with outstanding fees may not be allowed to sit for examinations.
   - Late payment penalties are outlined in the student handbook.

7. REFUNDS:
   - Refund policies are outlined in the student handbook.
   - Refund requests must be submitted in writing with supporting documentation.
   - Refunds are subject to approval by the college administration.
   - Processing time for refunds may take up to 30 business days.

8. CONFIDENTIALITY:
   - Payment information is confidential and protected by college policy.
   - Payment records will not be shared with third parties without authorization.
   - Students must protect their payment receipts and reference numbers.

9. MODIFICATIONS:
   - The college reserves the right to modify fee structures and payment policies.
   - Students will be notified of any changes through official channels.
   - Changes will be effective from the date of notification.

10. LEGAL COMPLIANCE:
    - All payments are subject to applicable laws and regulations.
    - The college complies with all financial reporting requirements.
    - Payment records are maintained in accordance with legal requirements.

CONTACT INFORMATION:

Finance Department:
- Email: finance@ccht.edu.ng
- Phone: [To be provided]
- Office Hours: Monday - Friday, 8:00 AM - 4:00 PM
- Location: Administration Building, Ground Floor

Student Affairs:
- Email: students@ccht.edu.ng
- Phone: [To be provided]
- Office Hours: Monday - Friday, 8:00 AM - 4:00 PM
- Location: Student Affairs Building, First Floor

College Administration:
- Email: admin@ccht.edu.ng
- Phone: [To be provided]
- Office Hours: Monday - Friday, 8:00 AM - 4:00 PM
- Location: Administration Building, Second Floor

EMERGENCY CONTACTS:
- College Security: security@ccht.edu.ng
- Emergency Line: [To be provided]
- Medical Emergency: [To be provided]

IMPORTANT REMINDERS:

1. Keep this receipt in a safe place.
2. Do not share your payment reference number with unauthorized persons.
3. Report any suspicious activity related to your payments immediately.
4. Regularly check your student portal for payment updates.
5. Contact the finance department if you have any questions about your payment.

CROSS COLLEGE OF HEALTH TECHNOLOGY
Excellence in Health Education

This is a computer-generated receipt. No signature required.
This document is official and confidential.
Any unauthorized reproduction or distribution is prohibited.

---
RECEIPT VERIFICATION:

To verify this receipt online:
1. Visit the college portal: [portal URL]
2. Navigate to Payment Verification
3. Enter your Receipt ID: ${receiptId}
4. Enter your Reference Number: ${reference}

For in-person verification, visit the Finance Department with this receipt and your student ID card.

This receipt was generated on: ${new Date().toISOString()}
System: Cross College of Health Technology Payment System
Version: 1.0
    `.trim()
}
