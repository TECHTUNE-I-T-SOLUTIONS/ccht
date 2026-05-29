'use client'

import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SCHOOL_INFO } from '@/lib/constants'
import { Mail, Phone, MapPin, Send } from 'lucide-react'
import { useState } from 'react'
import { ContactFormSchema } from '@/lib/validation'

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const result = ContactFormSchema.safeParse(formData)
      if (!result.success) {
        setMessage('Please fill in all fields correctly')
        return
      }

      const response = await fetch('/api/v1/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })

      if (response.ok) {
        setMessage('Thank you! We will get back to you shortly.')
        setFormData({ name: '', email: '', subject: '', message: '' })
      } else {
        setMessage('Failed to send message. Please try again.')
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="animated-bg-surface relative overflow-hidden py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
            <p className="text-lg text-foreground/70">Have questions? We&apos;d love to hear from you</p>
          </div>
        </section>

        <section className="py-16 md:py-20">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                {[
                  { icon: MapPin, label: 'Address', value: SCHOOL_INFO.address },
                  { icon: Mail, label: 'Email', value: SCHOOL_INFO.email },
                  { icon: Phone, label: 'Phone', value: SCHOOL_INFO.phone },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">{label}</h3>
                    </div>
                    <p className="text-foreground/70 ml-8">{value}</p>
                  </div>
                ))}

                <div className="mt-8 p-6 bg-primary/5 rounded-lg">
                  <h3 className="font-bold mb-3">Office Hours</h3>
                  <div className="space-y-2 text-sm text-foreground/70">
                    <p>Monday - Friday: 8:00 AM - 5:00 PM</p>
                    <p>Saturday: 9:00 AM - 2:00 PM</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="lg:col-span-2 bg-card border border-border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="contact-name" className="block text-sm font-medium mb-2">Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your full name"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-email" className="block text-sm font-medium mb-2">Email</label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-subject" className="block text-sm font-medium mb-2">Subject</label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="How can we help?"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="contact-message" className="block text-sm font-medium mb-2">Message</label>
                    <textarea
                      id="contact-message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      placeholder="Write your message here"
                      className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      required
                    />
                  </div>

                  {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.includes('Thank you') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {message}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? 'Sending...' : <>Send Message <Send className="w-4 h-4" /></>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 bg-card">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                { q: 'What are the admission requirements?', a: 'You need a high school diploma or equivalent and meet program-specific prerequisites.' },
                { q: 'Is financial aid available?', a: 'Yes, we offer payment plans and scholarships for qualified students.' },
                { q: 'Do you offer online classes?', a: 'Some programs may have online components. Contact us for specific program details.' },
                { q: 'What is the student-to-lecturer ratio?', a: 'We maintain a favorable ratio of approximately 15:1 to ensure quality education.' },
              ].map(({ q, a }, idx) => (
                <details key={idx} className="bg-background border border-border rounded-lg p-4">
                  <summary className="font-semibold cursor-pointer text-primary">{q}</summary>
                  <p className="mt-3 text-foreground/70">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
