import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ProgramService } from '@/lib/services/program.service'
import { ProgramsList } from '@/components/public/programs-list'
import { generatePageMetadata } from '@/lib/metadata'

export const metadata = generatePageMetadata({
  title: 'Programs',
  description: 'Available academic programs and their key details.',
  path: '/programs',
})

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
