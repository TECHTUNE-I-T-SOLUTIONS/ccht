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

export function generateAdmissionLetter(data: AdmissionLetterData): string {
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

  return `
CROSS COLLEGE OF HEALTH TECHNOLOGY
OFFICIAL ADMISSION LETTER

${admissionDate}

Dear ${firstName} ${lastName},

RE: ADMISSION INTO ${program.toUpperCase()} PROGRAM

We are pleased to inform you that you have been offered admission into the ${program} program at Cross College of Health Technology for the ${new Date().getFullYear()}/${new Date().getFullYear() + 1} academic session.

ADMISSION DETAILS:
- Student Name: ${firstName} ${lastName}
- Matric Number: ${matricNumber}
- Program: ${program}
- Department: ${department}
- Current Level: ${level}L
- Admission Date: ${admissionDate}

This admission is subject to the following conditions:

1. PAYMENT OF FEES:
   All required fees must be paid within the stipulated period as indicated in the fee schedule. Failure to pay fees may result in the withdrawal of this admission.

   Fee Structure:
   - Application Fee: ₦6,500.00
   - Admission Fee: ₦30,000.00
   - Tuition Fee: As per program schedule
   - Other Fees: Laboratory, Library, Examination, etc.

   Payment Methods:
   - Paystack (Online Payment)
   - Bank Transfer
   - Cash (at designated bank branches)

   Late payment penalties may apply for payments made after the deadline.

2. REGISTRATION:
   You must complete all registration formalities within the first two weeks of the academic session. This includes:
   - Submission of all required documents
   - Completion of the oath form
   - Payment of all required fees
   - Collection of student ID card
   - Registration for courses

   Failure to complete registration within the specified period may result in the forfeiture of your admission.

3. ACADEMIC REQUIREMENTS:
   You are expected to maintain satisfactory academic progress throughout your program. The minimum requirements include:

   Grade Point Average (GPA):
   - Minimum Cumulative GPA: 2.0 (on a 4.0 scale)
   - Probation: GPA below 2.0 for one semester
   - Warning: GPA below 1.5 for one semester
   - Withdrawal: GPA below 1.0 for two consecutive semesters

   Attendance Policy:
   - Minimum 75% attendance in all classes
   - Minimum 80% attendance in practical/laboratory sessions
   - Minimum 90% attendance in clinical rotations
   - Absence from examinations requires prior approval

   Course Requirements:
   - Complete all core courses for your program
   - Pass all required examinations
   - Complete all clinical rotations
   - Submit all required assignments and projects

SCHOOL RULES AND REGULATIONS:

A. ATTENDANCE AND PUNCTUALITY:
   
   Class Attendance:
   - Students must attend all scheduled classes, lectures, and practical sessions
   - Roll calls will be taken at the beginning of each class
   - Late arrival (more than 15 minutes) will be recorded as absence
   - Three consecutive unexcused absences may result in disciplinary action
   - Medical certificates required for illness-related absences

   Examination Attendance:
   - Students must arrive at examination venues at least 30 minutes before scheduled time
   - Latecomers may not be allowed to enter the examination hall
   - Absence from examinations without prior approval results in automatic failure
   - Special examinations may be granted only with valid medical evidence

   Clinical Rotation Attendance:
   - Clinical attendance is mandatory for all health programs
   - Students must report to clinical sites at the scheduled time
   - Proper uniform and identification must be worn at all times
   - Any absence from clinical rotation must be reported to the clinical coordinator

B. CONDUCT AND DISCIPLINE:

   General Conduct:
   - Students must conduct themselves with dignity and respect at all times
   - Respect for college staff, fellow students, and patients is mandatory
   - Physical or verbal abuse of any person is strictly prohibited
   - Harassment, bullying, or discrimination will not be tolerated
   - Students are ambassadors of the college and must uphold its reputation

   Academic Integrity:
   - All forms of academic dishonesty are prohibited
   - Cheating in examinations, assignments, or practical work results in automatic failure
   - Plagiarism (copying others' work without attribution) is a serious offense
   - Unauthorized collaboration on individual assignments is prohibited
   - Penalties for academic dishonesty include: warning, suspension, or expulsion

   Professional Conduct:
   - As future healthcare professionals, students must maintain high ethical standards
   - Patient confidentiality must be strictly observed during clinical rotations
   - Professional boundaries must be maintained with patients and colleagues
   - Students must follow professional codes of conduct at all times

   Substance Abuse:
   - Use of prohibited substances (alcohol, drugs, etc.) on campus is grounds for expulsion
   - Students under the influence of substances will not be allowed in classes or clinical areas
   - Possession or distribution of illegal substances is a criminal offense
   - The college reserves the right to conduct random substance tests

C. DRESS CODE AND APPEARANCE:

   General Dress Code:
   - Students must dress appropriately and professionally while on campus
   - Clothing should be modest, clean, and in good condition
   - Offensive or inappropriate slogans/images on clothing are prohibited
   - Footwear must be worn at all times (except in designated areas)

   Clinical/Laboratory Dress Code:
   - Specific uniforms are required for clinical sessions and laboratory work
   - White laboratory coats must be worn during laboratory sessions
   - Clinical uniforms must be clean and pressed
   - Closed-toe shoes are mandatory in clinical and laboratory areas
   - Jewelry should be minimal and not interfere with clinical work
   - Long hair must be tied back during clinical procedures

   Examination Dress Code:
   - Students must wear appropriate attire for examinations
   - No caps, hats, or head coverings (except for religious reasons)
   - No clothing with large pockets that could conceal unauthorized materials

D. USE OF COLLEGE FACILITIES:

   Library:
   - Library books must be returned by the due date to avoid fines
   - Silence must be observed in the library
   - Eating and drinking are not permitted in the library
   - Damage to library books will result in financial liability
   - Lost books must be paid for or replaced

   Laboratory:
   - Laboratory equipment must be used with care and returned in good condition
   - Safety protocols must be followed at all times
   - Personal protective equipment (PPE) must be worn as required
   - Unauthorized removal of laboratory equipment is prohibited
   - Report any equipment malfunction immediately to the instructor

   Computer Facilities:
   - College computers are for academic purposes only
   - Installation of unauthorized software is prohibited
   - Access to inappropriate websites is not allowed
   - Students must log off after using computer facilities
   - Damage to computer equipment will result in financial liability

   Hostel/Accommodation:
   - Hostel residents must comply with hostel rules and regulations
   - Visitors are only allowed during designated hours with proper authorization
   - Noise must be kept to a minimum to respect other residents
   - Cooking in hostel rooms is prohibited (except in designated areas)
   - Hostel fees must be paid by the due date

E. EXAMINATION REGULATIONS:

   Examination Conduct:
   - Students must arrive at examination venues at least 30 minutes before scheduled time
   - Student ID card must be presented for examination entry
   - Unauthorized materials (books, notes, phones, etc.) are strictly prohibited
   - Talking or communication with other students during examinations is prohibited
   - Leaving the examination hall requires permission from the invigilator

   Examination Malpractice:
   - Any form of examination malpractice results in automatic failure
   - Penalties include: zero grade, suspension, or expulsion
   - Students caught cheating will be reported to the appropriate authorities
   - A record of examination malpractice will be placed in the student's file

   Special Considerations:
   - Students with disabilities may request special examination arrangements
   - Medical emergencies during examinations must be documented
   - Religious observances during examination periods must be reported in advance

F. HEALTH AND SAFETY:

   General Safety:
   - Students must comply with all health and safety regulations
   - Emergency exits must be kept clear at all times
   - Fire drills must be taken seriously
   - Report any safety hazards immediately to the administration

   Laboratory Safety:
   - Safety protocols must be followed at all times in laboratories
   - Personal protective equipment (PPE) must be worn as required
   - Chemicals must be handled according to safety guidelines
   - Report any accidents or spills immediately to the instructor

   Clinical Safety:
   - Infection control protocols must be followed during clinical rotations
   - Proper hand hygiene must be practiced at all times
   - Needle stick injuries must be reported immediately
   - Exposure to infectious diseases must be reported to the college health center

   Health Center:
   - The college health center provides basic medical services
   - Students with health concerns should visit the health center
   - Serious medical conditions should be reported to the administration
   - Health insurance information should be submitted during registration

G. FINANCIAL OBLIGATIONS:

   Fee Payment:
   - All fees must be paid by the due dates to avoid late payment penalties
   - Students with outstanding fees may not be allowed to sit for examinations
   - Fee schedules are available at the finance department and on the college portal
   - Payment receipts must be kept for records

   Refund Policy:
   - Refund requests must be submitted in writing to the finance department
   - Refunds are subject to college refund policy
   - Processing time for refunds may take up to 30 days
   - Administrative fees may be deducted from refunds

   Financial Aid:
   - Scholarships and financial aid are available to eligible students
   - Applications for financial aid must be submitted by the deadline
   - Academic performance may affect financial aid eligibility
   - Students on financial aid must maintain satisfactory academic progress

H. COMMUNICATION:

   Official Communications:
   - Official communications will be sent through your registered email
   - The college portal is the primary source of information
   - Students are responsible for regularly checking email and portal notifications
   - Change of contact information must be reported to the administration immediately

   Email Policy:
   - College email addresses are provided to all students
   - Students should check their college email regularly
   - Important announcements are sent via email
   - Professional email etiquette must be observed

   Social Media:
   - The college has official social media pages for announcements
   - Students are encouraged to follow official college social media accounts
   - Inappropriate social media posts about the college may result in disciplinary action
   - Students must not share confidential college information on social media

I. ACCOMMODATION (if applicable):

   Hostel Rules:
   - Hostel residents must comply with all hostel rules and regulations
   - Room allocation is done by the hostel administration
   - Room changes require approval from the hostel warden
   - Hostel fees must be paid by the due date

   Visitor Policy:
   - Visitors are only allowed during designated visiting hours
   - Overnight visitors are not permitted without prior approval
   - All visitors must sign in at the hostel security post
   - Students are responsible for the conduct of their visitors

   Hostel Facilities:
   - Common areas must be kept clean and tidy
   - Noise must be kept to a minimum to respect other residents
   - Damage to hostel property will result in financial liability
   - Cooking in rooms is prohibited (except in designated kitchen areas)

J. PROFESSIONAL CONDUCT:

   Healthcare Ethics:
   - As future healthcare professionals, you are expected to maintain high ethical standards
   - Patient confidentiality must be strictly observed at all times
   - Informed consent must be obtained before any procedure
   - Professional boundaries must be maintained with patients

   Clinical Rotations:
   - Students must follow the protocols of the clinical facility
   - Respect for clinical staff and patients is mandatory
   - Students must report to clinical sites on time
   - Proper uniform and identification must be worn at all times

   Professional Development:
   - Students are encouraged to participate in professional development activities
   - Attendance at seminars and workshops is recommended
   - Membership in professional associations is encouraged
   - Students should stay updated with developments in their field

IMPORTANT DATES:
- Orientation Date: ${orientationDate}
- Registration Deadline: ${registrationDeadline}
- First Day of Classes: ${firstDayOfClass}
- Examination Period: As per academic calendar

CONTACT INFORMATION:
- College Administration: admin@ccht.edu.ng
- Student Affairs: students@ccht.edu.ng
- Academic Office: academic@ccht.edu.ng
- Finance Department: finance@ccht.edu.ng
- Health Center: health@ccht.edu.ng
- Library: library@ccht.edu.ng

EMERGENCY CONTACTS:
- College Security: security@ccht.edu.ng
- Emergency Line: [To be provided]
- Medical Emergency: [To be provided]

Please note that this admission is provisional and subject to verification of all submitted documents. Any false information provided may result in the cancellation of this admission.

Congratulations on your admission. We look forward to welcoming you to Cross College of Health Technology and supporting you on your journey to becoming a healthcare professional.

Yours faithfully,

The Registrar
Cross College of Health Technology

---
This document is official and confidential.
Any unauthorized reproduction or distribution is prohibited.
Cross College of Health Technology
Excellence in Health Education
    `.trim()
}
