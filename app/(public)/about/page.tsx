import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { ROUTES, SCHOOL_INFO } from '@/lib/constants'
import { CheckCircle, Users, Target, Lightbulb } from 'lucide-react'
import Link from 'next/link'

export const metadata = {
  title: `About - ${SCHOOL_INFO.name}`,
  description: 'Learn about our institution, mission, vision, and values.',
}

export default function AboutPage() {
  const values = [
    { icon: Target, title: 'Excellence', description: 'Committed to the highest standards in education and training' },
    { icon: Users, title: 'Integrity', description: 'Operating with honesty, transparency, and ethical principles' },
    { icon: Lightbulb, title: 'Innovation', description: 'Embracing modern teaching methods and healthcare practices' },
  ]

  const team = [
    { name: 'Dr. Adeyemi Oladele', role: 'Provost', area: 'Healthcare Management' },
    { name: 'Prof. Akinola Mustapha', role: 'Dean of Academics', area: 'Medical Education' },
    { name: 'Nurse Ifeoma Nwosu', role: 'Head of Nursing', area: 'Nursing Practice' },
    { name: 'Dr. Chukwu Amara', role: 'Director of Programs', area: 'Curriculum Development' },
  ]

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="animated-bg-surface relative overflow-hidden py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-balance">About {SCHOOL_INFO.shortName}</h1>
            <p className="text-lg text-foreground/70">{SCHOOL_INFO.tagline}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.register}
                className="inline-flex items-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Apply for Admission
              </Link>
              <Link
                href={ROUTES.login}
                className="inline-flex items-center rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 hover:text-primary"
              >
                Open Portal
              </Link>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-20 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-foreground/70 leading-relaxed">
                  To provide quality education and training in health technologies, producing competent, compassionate, and innovative healthcare professionals who contribute to societal health and well-being. We are committed to fostering an environment of academic excellence, professional growth, and community service.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-8">
                <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
                <p className="text-foreground/70 leading-relaxed">
                  To be a leading institution of excellence in health technology education, recognized locally and internationally for producing skilled healthcare professionals who advance healthcare delivery and contribute meaningfully to public health in Nigeria and beyond.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-20 md:py-24 bg-card">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {values.map((value) => {
                const Icon = value.icon
                return (
                  <div key={value.title} className="rounded-2xl border border-border bg-background p-6 text-center">
                    <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                    <p className="text-foreground/60">{value.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* History & Achievements */}
        <section className="py-20 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-12">Our Journey</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                'Founded to expand access to quality health technology education in Nigeria.',
                'Developed into a respected center for practical healthcare training and discipline.',
                'Continuously improving curriculum to meet modern healthcare and workforce needs.',
              ].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-card p-6 text-foreground/75">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-20 md:py-24 bg-card">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-12 text-center">Leadership Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {team.map((member) => (
                <div key={member.name} className="bg-background border border-border rounded-lg p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg">{member.name}</h3>
                  <p className="text-primary text-sm font-semibold mb-2">{member.role}</p>
                  <p className="text-foreground/60 text-sm">{member.area}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facilities */}
        <section className="py-20 md:py-24">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-12">Our Facilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { title: 'Modern Classroom', description: 'Well-equipped learning spaces with audio-visual facilities' },
                { title: 'Laboratory Equipment', description: 'State-of-the-art equipment for practical training' },
                { title: 'Clinical Simulation Center', description: 'Realistic training environment for healthcare procedures' },
                { title: 'Computer Lab', description: 'Modern computers for research and digital skills training' },
                { title: 'Library & Resource Center', description: 'Comprehensive collection of textbooks and journals' },
                { title: 'Hostel Accommodation', description: 'Comfortable living facilities for students' },
              ].map((facility) => (
                <div key={facility.title} className="border border-border rounded-lg p-6">
                  <CheckCircle className="w-6 h-6 text-primary mb-3" />
                  <h3 className="font-bold text-lg mb-2">{facility.title}</h3>
                  <p className="text-foreground/60">{facility.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
