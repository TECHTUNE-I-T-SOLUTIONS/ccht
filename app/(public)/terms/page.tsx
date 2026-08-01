import { Navbar } from '@/components/public/navbar'
import { Footer } from '@/components/public/footer'
import { SCHOOL_INFO } from '@/lib/constants'

export const metadata = {
  title: `Terms of Service - ${SCHOOL_INFO.name}`,
  description: 'Terms governing use of Covenant College of Health Technology online services.',
}

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="animated-bg-surface py-16 md:py-20">
        <section className="mx-auto w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-10">
            <h1 className="text-3xl font-bold md:text-4xl">Terms of Service</h1>
            <p className="mt-3 text-sm text-foreground/70">Last updated: July 31, 2026</p>

            <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/80 md:text-base">
              <section>
                <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
                <p className="mt-2">
                  By accessing and using the digital platforms of Covenant College of Health Technology ("CCHT", "the College", "we", or "our"), including our website, student portal, admission systems, and related services, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with these terms, please do not use our services.
                </p>
                <p className="mt-2">
                  These terms constitute a legally binding agreement between you and CCHT. Your use of our platforms indicates your acceptance of these terms and our Privacy Policy.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">2. Description of Services</h2>
                <p className="mt-2">CCHT provides digital services including but not limited to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Student Portal:</strong> Access to academic records, course registration, results, and student information</li>
                  <li><strong>Admission System:</strong> Online application processing, admission status tracking, and enrollment management</li>
                  <li><strong>Payment Services:</strong> Online fee payment, receipt generation, and financial transaction processing</li>
                  <li><strong>Academic Resources:</strong> Access to course materials, online classes, library resources, and study materials</li>
                  <li><strong>Communication Tools:</strong> Email notifications, announcements, and messaging systems</li>
                  <li><strong>AI-Powered Features:</strong> Academic support tools, chatbot assistance, and automated administrative services</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">3. User Accounts and Registration</h2>
                
                <h3 className="mt-4 font-semibold">3.1 Account Creation</h3>
                <p className="mt-2">To access certain services, you must create an account and provide accurate, complete, and current information. You agree to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Provide truthful and accurate information during registration</li>
                  <li>Maintain and update your information to keep it accurate</li>
                  <li>Accept responsibility for all activities under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                </ul>

                <h3 className="mt-4 font-semibold">3.2 Account Security</h3>
                <p className="mt-2">You are responsible for maintaining the confidentiality of your account credentials. You agree to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Not share your password or login details with anyone</li>
                  <li>Use strong, unique passwords and enable two-factor authentication when available</li>
                  <li>Log out from your account after each session, especially on shared devices</li>
                  <li>Accept full responsibility for activities conducted under your account</li>
                </ul>

                <h3 className="mt-4 font-semibold">3.3 Account Termination</h3>
                <p className="mt-2">CCHT reserves the right to suspend or terminate your account at any time for violation of these terms, academic misconduct, fraudulent activity, or any other reason deemed necessary to protect the College's interests.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">4. Acceptable Use Policy</h2>
                
                <h3 className="mt-4 font-semibold">4.1 Permitted Use</h3>
                <p className="mt-2">You may use our platforms for legitimate academic and administrative purposes, including:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Accessing your academic records and personal information</li>
                  <li>Registering for courses and managing your academic schedule</li>
                  <li>Paying fees and accessing financial records</li>
                  <li>Communicating with faculty, staff, and fellow students</li>
                  <li>Accessing educational resources and materials</li>
                  <li>Using AI tools for academic support and learning assistance</li>
                </ul>

                <h3 className="mt-4 font-semibold">4.2 Prohibited Activities</h3>
                <p className="mt-2">You agree NOT to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Use the platform for any illegal or unauthorized purpose</li>
                  <li>Attempt to gain unauthorized access to any part of the platform or other users' accounts</li>
                  <li>Interfere with or disrupt the platform's operation or servers</li>
                  <li>Upload or transmit viruses, malware, or malicious code</li>
                  <li>Engage in academic dishonesty, plagiarism, or cheating</li>
                  <li>Harass, abuse, or harm other users or staff</li>
                  <li>Impersonate any person or entity or misrepresent your affiliation</li>
                  <li>Use automated tools to scrape, harvest, or collect data from the platform</li>
                  <li>Attempt to reverse engineer or circumvent security measures</li>
                  <li>Use AI tools to generate academic work for submission as your own</li>
                  <li>Share confidential or sensitive information with AI tools</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">5. AI Tools Usage Terms</h2>
                
                <h3 className="mt-4 font-semibold">5.1 AI-Powered Features</h3>
                <p className="mt-2">CCHT provides AI-powered features to enhance your educational experience. By using these features, you agree to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Use AI tools as supplementary learning aids, not replacements for academic work</li>
                  <li>Verify all AI-generated information before relying on it for important decisions</li>
                  <li>Not submit AI-generated content as your original work without proper attribution</li>
                  <li>Report any errors, biases, or inappropriate AI-generated content to CCHT</li>
                </ul>

                <h3 className="mt-4 font-semibold">5.2 AI Usage Limitations</h3>
                <p className="mt-2 font-semibold text-orange-600">Important Warnings:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li><strong>Accuracy:</strong> AI-generated content may contain errors, hallucinations, or outdated information. Always verify through official sources</li>
                  <li><strong>Privacy:</strong> Do not input personal, financial, health, or confidential information into AI tools</li>
                  <li><strong>Academic Integrity:</strong> Using AI to complete assignments, exams, or assessments without authorization constitutes academic dishonesty</li>
                  <li><strong>Professional Advice:</strong> AI tools cannot replace professional medical, legal, or academic advice</li>
                  <li><strong>Data Usage:</strong> Your interactions with AI tools may be logged for quality improvement and system training</li>
                </ul>

                <h3 className="mt-4 font-semibold">5.3 Third-Party AI Services</h3>
                <p className="mt-2">Some AI features may be powered by third-party services. Your use of these features is also subject to the third-party's terms of service and privacy policies. CCHT is not responsible for the content or behavior of third-party AI services.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">6. Academic Integrity</h2>
                <p className="mt-2">As an educational institution, CCHT upholds the highest standards of academic integrity. You agree to:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Submit only your own original work for assessments and examinations</li>
                  <li>Properly cite all sources and references in your academic work</li>
                  <li>Not use AI tools, unauthorized aids, or assistance during examinations</li>
                  <li>Not collaborate on individual assignments unless explicitly permitted</li>
                  <li>Not falsify, fabricate, or misrepresent any academic records or data</li>
                </ul>
                <p className="mt-2">Violations of academic integrity may result in disciplinary action, including grade penalties, suspension, or expulsion.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">7. Payment Terms</h2>
                
                <h3 className="mt-4 font-semibold">7.1 Fee Payment</h3>
                <p className="mt-2">All fees must be paid according to the College's fee schedule and payment deadlines. Late payments may incur penalties and may affect access to services.</p>

                <h3 className="mt-4 font-semibold">7.2 Payment Security</h3>
                <p className="mt-2">Payments are processed through secure third-party payment gateways. CCHT does not store your complete payment card information. You agree to provide accurate payment information and authorize charges for fees and services.</p>

                <h3 className="mt-4 font-semibold">7.3 Refunds</h3>
                <p className="mt-2">Refunds are subject to the College's refund policy. Requests for refunds must be submitted in writing through official channels and will be reviewed on a case-by-case basis.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">8. Intellectual Property</h2>
                
                <h3 className="mt-4 font-semibold">8.1 College Content</h3>
                <p className="mt-2">All content on CCHT platforms, including text, graphics, logos, images, software, and materials, is owned by CCHT or its licensors and is protected by copyright and other intellectual property laws. You may not reproduce, distribute, or create derivative works without explicit permission.</p>

                <h3 className="mt-4 font-semibold">8.2 User Content</h3>
                <p className="mt-2">By submitting content to our platforms, you grant CCHT a non-exclusive, royalty-free license to use, reproduce, and display such content for educational and administrative purposes. You represent that you have the right to grant such license.</p>

                <h3 className="mt-4 font-semibold">8.3 AI-Generated Content</h3>
                <p className="mt-2">Content generated by AI tools on our platform may be used by CCHT for system improvement and training purposes. You retain ownership of your original inputs, but grant CCHT the right to use AI-generated outputs for legitimate educational purposes.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">9. Privacy and Data Protection</h2>
                <p className="mt-2">Your use of our platforms is also governed by our Privacy Policy, which explains how we collect, use, and protect your personal information. By using our services, you consent to such collection and use as described in our Privacy Policy.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">10. Disclaimer of Warranties</h2>
                <p className="mt-2">Our platforms are provided "as is" and "as available" without warranties of any kind, express or implied. We do not guarantee:</p>
                <ul className="mt-2 list-disc space-y-1 pl-6">
                  <li>Uninterrupted or error-free operation of the platforms</li>
                  <li>Accuracy or reliability of AI-generated content</li>
                  <li>That defects will be corrected</li>
                  <li>The security of the platforms against all threats</li>
                  <li>The results of using the platforms will meet your requirements</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold">11. Limitation of Liability</h2>
                <p className="mt-2">To the maximum extent permitted by law, CCHT shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of data, loss of academic progress, or loss of profits, arising from your use or inability to use our platforms, including any damages resulting from AI-generated content.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">12. Indemnification</h2>
                <p className="mt-2">You agree to indemnify and hold CCHT harmless from any claims, damages, losses, liabilities, and expenses arising from your use of our platforms, violation of these terms, or infringement of any third-party rights.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">13. Modifications to Terms</h2>
                <p className="mt-2">CCHT reserves the right to modify these terms at any time. Changes will be effective immediately upon posting on our platforms. Your continued use after modifications constitutes acceptance of the updated terms. We will notify users of significant changes via email or platform announcements.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">14. Governing Law and Dispute Resolution</h2>
                <p className="mt-2">These terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these terms shall be resolved through negotiation, mediation, or arbitration as prescribed by Nigerian law. Courts in Nigeria shall have exclusive jurisdiction over any legal proceedings.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">15. Severability</h2>
                <p className="mt-2">If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it enforceable.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">16. Entire Agreement</h2>
                <p className="mt-2">These terms, together with our Privacy Policy, constitute the entire agreement between you and CCHT regarding your use of our platforms and supersede all prior agreements or understandings.</p>
              </section>

              <section>
                <h2 className="text-xl font-semibold">17. Contact Information</h2>
                <p className="mt-2">For questions about these Terms of Service, please contact:</p>
                <ul className="mt-2 list-none space-y-1">
                  <li><strong>Email:</strong> {SCHOOL_INFO.email}</li>
                  <li><strong>Address:</strong> {SCHOOL_INFO.address}</li>
                  <li><strong>Phone:</strong> {SCHOOL_INFO.phone}</li>
                </ul>
              </section>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
