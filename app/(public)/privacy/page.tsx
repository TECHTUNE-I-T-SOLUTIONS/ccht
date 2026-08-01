import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SCHOOL_INFO } from '@/lib/constants'

export const metadata = {
  title: `Privacy Policy - ${SCHOOL_INFO.name}`,
  description: 'Privacy policy for Covenant College of Health Technology digital services.',
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="animated-bg-surface py-16 md:py-20">
        <section className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
            <h1 className="text-3xl font-bold md:text-4xl">Privacy Policy</h1>
            <p className="mt-3 text-sm text-foreground/70">Last updated: July 31, 2026</p>

            <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/80 md:text-base">
              <section>
                <h2 className="text-xl font-semibold">1. Introduction</h2>
                <p className="mt-2">
                  Covenant College of Health Technology ("CCHT", "we", "our", or "the College") is committed to protecting the privacy and security of personal information collected through our digital platforms, including our website, student portal, admission systems, and related services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information in accordance with applicable data protection laws, including the Nigeria Data Protection Regulation (NDPR) and international best practices.
                </p>
                <p className="mt-2">
                  By using our services, you agree to the collection and use of information in accordance with this policy. If you do not agree with our practices, please do not use our platforms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">2. Information We Collect</h2>
                
                <h3 className="mt-4 font-semibold">2.1 Personal Information</h3>
                <p className="mt-2">We collect personal information that you voluntarily provide, including:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Identification Data:</strong> Full name, date of birth, gender, nationality, state of origin, local government area</li>
                  <li><strong>Contact Information:</strong> Email address, phone number, residential address, city, state</li>
                  <li><strong>Academic Information:</strong> Student number, matric number, program of study, department, academic session, current level, admission date</li>
                  <li><strong>Medical Information:</strong> Blood group, genotype (for health and safety purposes)</li>
                  <li><strong>Guardian/Emergency Information:</strong> Guardian name, phone, email; emergency contact name and phone</li>
                  <li><strong>Account Credentials:</strong> Username, password (stored in encrypted form), security questions</li>
                  <li><strong>Financial Information:</strong> Payment details, transaction history, fee records (processed through secure payment gateways)</li>
                </ul>

                <h3 className="mt-4 font-semibold">2.2 Automatically Collected Information</h3>
                <p className="mt-2">When you access our platforms, we automatically collect:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                  <li><strong>Usage Data:</strong> Pages visited, time spent, features used, click patterns</li>
                  <li><strong>Log Data:</strong> Login times, session duration, error logs, system events</li>
                </ul>

                <h3 className="mt-4 font-semibold">2.3 AI-Related Data</h3>
                <p className="mt-2">When you interact with AI-powered features on our platform, we may collect:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Input Data:</strong> Questions, prompts, or content you submit to AI tools</li>
                  <li><strong>Interaction Data:</strong> Your responses to AI-generated content, feedback, and corrections</li>
                  <li><strong>Performance Data:</strong> AI tool usage patterns, effectiveness metrics, and improvement data</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">3. How We Use Your Information</h2>
                
                <h3 className="mt-4 font-semibold">3.1 Primary Purposes</h3>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Academic Administration:</strong> Student registration, course enrollment, grade management, transcript generation</li>
                  <li><strong>Admissions Processing:</strong> Application review, admission decisions, offer letters, enrollment tracking</li>
                  <li><strong>Communication:</strong> Sending important notifications, academic announcements, fee reminders, emergency alerts</li>
                  <li><strong>Financial Operations:</strong> Fee payment processing, receipt generation, financial aid administration</li>
                  <li><strong>Identity Verification:</strong> Account authentication, access control, security verification</li>
                  <li><strong>Service Delivery:</strong> Providing access to online classes, resources, library services, and student support</li>
                </ul>

                <h3 className="mt-4 font-semibold">3.2 AI Tool Usage</h3>
                <p className="mt-2">We use AI technologies to enhance your educational experience:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Academic Support:</strong> AI tutoring, study assistance, and personalized learning recommendations</li>
                  <li><strong>Administrative Efficiency:</strong> Automated document processing, chatbot support, and workflow optimization</li>
                  <li><strong>Content Generation:</strong> Drafting communications, summarizing information, and generating reports</li>
                </ul>
                <p className="mt-2 font-semibold text-orange-600">Important AI Usage Notice:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>AI-generated content may not always be accurate. Always verify important information through official channels</li>
                  <li>Your interactions with AI tools may be used to improve system performance and accuracy</li>
                  <li>Do not share sensitive personal, financial, or confidential information with AI tools</li>
                  <li>AI tools are supplements to, not replacements for, human academic guidance and professional advice</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">4. Data Sharing and Disclosure</h2>
                
                <h3 className="mt-4 font-semibold">4.1 When We Share Information</h3>
                <p className="mt-2">We may share your information in the following circumstances:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Academic Authorities:</strong> With relevant educational bodies, examination councils, and regulatory agencies as required by law</li>
                  <li><strong>Service Providers:</strong> With third-party vendors who provide essential services (payment processors, cloud hosting, email services) under strict confidentiality agreements</li>
                  <li><strong>Legal Requirements:</strong> When required by law, court order, or government authority</li>
                  <li><strong>Safety and Security:</strong> To protect the rights, property, or safety of CCHT, our students, or the public</li>
                  <li><strong>Business Transfers:</strong> In connection with any merger, acquisition, or sale of assets (with notice)</li>
                </ul>

                <h3 className="mt-4 font-semibold">4.2 AI Service Providers</h3>
                <p className="mt-2">Some AI features may be powered by third-party AI services. When you use these features:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Your inputs may be processed by external AI providers according to their own privacy policies</li>
                  <li>We select AI providers with strong data protection commitments</li>
                  <li>Review the specific AI tool's privacy policy before use</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">5. Data Security</h2>
                <p className="mt-2">We implement robust security measures to protect your information:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Encryption:</strong> Data is encrypted in transit and at rest using industry-standard encryption protocols</li>
                  <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication for sensitive operations</li>
                  <li><strong>Audit Logging:</strong> Comprehensive logging of all data access and modifications</li>
                  <li><strong>Regular Security Reviews:</strong> Periodic security assessments and vulnerability testing</li>
                  <li><strong>Secure Infrastructure:</strong> Hosting on compliant cloud platforms with security certifications</li>
                </ul>
                <p className="mt-2">However, no method of transmission over the internet is completely secure. We cannot guarantee absolute security.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">6. Data Retention</h2>
                <p className="mt-2">We retain your information for as long as necessary for the purposes outlined in this policy:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Academic Records:</strong> Retained permanently as required by educational regulations</li>
                  <li><strong>Financial Records:</strong> Retained for 7 years as required by tax and financial regulations</li>
                  <li><strong>Application Data:</strong> Retained for 5 years after application or until enrollment</li>
                  <li><strong>AI Interaction Data:</strong> Retained for 1 year for system improvement and quality assurance</li>
                  <li><strong>Account Data:</strong> Retained until account deletion request, subject to legal retention requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">7. Your Rights</h2>
                <p className="mt-2">Under applicable data protection laws, you have the right to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate or incomplete data</li>
                  <li><strong>Deletion:</strong> Request deletion of your data (subject to legal and academic requirements)</li>
                  <li><strong>Portability:</strong> Request transfer of your data to another service</li>
                  <li><strong>Objection:</strong> Object to processing of your data for certain purposes</li>
                  <li><strong>Restriction:</strong> Request restriction of processing in certain circumstances</li>
                </ul>
                <p className="mt-2">To exercise these rights, contact us at {SCHOOL_INFO.email}. We will respond within 30 days.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">8. Cookies and Tracking Technologies</h2>
                <p className="mt-2">We use cookies and similar technologies to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Maintain your session and authentication state</li>
                  <li>Remember your preferences and settings</li>
                  <li>Analyze platform usage and performance</li>
                  <li>Provide personalized content and recommendations</li>
                </ul>
                <p className="mt-2">You can control cookie settings through your browser preferences. Note that disabling cookies may affect platform functionality.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">9. Children's Privacy</h2>
                <p className="mt-2">Our services are not directed to children under the age of 16. We do not knowingly collect personal information from children under 16 without parental consent. If we become aware of such collection, we will take steps to delete it.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">10. International Data Transfers</h2>
                <p className="mt-2">Your information may be transferred to and processed in countries other than Nigeria. We ensure appropriate safeguards are in place to protect your data in accordance with applicable data protection laws.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">11. Changes to This Policy</h2>
                <p className="mt-2">We may update this privacy policy from time to time. We will notify you of significant changes by posting the new policy on our platform and sending you an email notification. Your continued use after changes constitutes acceptance of the updated policy.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">12. Contact Us</h2>
                <p className="mt-2">For privacy-related questions, concerns, or requests, please contact:</p>
                <ul className="mt-2 list-none space-y-1">
                  <li><strong>Email:</strong> {SCHOOL_INFO.email}</li>
                  <li><strong>Address:</strong> {SCHOOL_INFO.address}</li>
                  <li><strong>Phone:</strong> {SCHOOL_INFO.phone}</li>
                </ul>
                <p className="mt-2">You may also contact the Nigeria Data Protection Commission for unresolved privacy complaints.</p>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
