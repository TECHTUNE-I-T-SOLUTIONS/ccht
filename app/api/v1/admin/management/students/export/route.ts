import { NextResponse } from 'next/server'
import { ManagementService } from '@/lib/services/admin/management-service'

export async function GET() {
  try {
    const students = await ManagementService.getAllStudentsForExport()
    
    // Convert to CSV
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Student Number',
      'Matric Number',
      'Current Level',
      'Admission Status',
      'Enrolled Date'
    ]

    const csvRows = [headers.join(',')]
    
    students.forEach((student: any) => {
      const row = [
        student.firstName,
        student.lastName,
        student.email,
        student.studentNumber,
        student.matricNumber,
        student.currentLevel,
        student.admissionStatus,
        student.enrolledAt
      ].map(field => `"${(field || '').toString().replace(/"/g, '""')}"`)
      
      csvRows.push(row.join(','))
    })

    const csvContent = csvRows.join('\n')
    
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=students-report-${new Date().toISOString().split('T')[0]}.csv`,
      },
    })
  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}