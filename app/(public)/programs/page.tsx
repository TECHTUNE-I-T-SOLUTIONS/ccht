import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ProgramService } from '@/lib/services/program.service'
import { SCHOOL_INFO } from '@/lib/constants'
import { ProgramsList } from '@/components/public/programs-list'

export const metadata = {
  title: `Programs | ${SCHOOL_INFO.name}`,
  description: 'Available academic programs and their key details.',
}

export default async function ProgramsPage() {
  const programs = await ProgramService.getAllPrograms()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ProgramsList programs={programs} />
      </main>
      <Footer />
    </div>
  )
}
