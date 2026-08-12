import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { metadata } from './metadata'

export { metadata }

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  )
}
