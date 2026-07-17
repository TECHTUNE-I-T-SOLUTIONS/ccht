import { redirect } from 'next/navigation'

export default function SecureSignupRedirectPage() {
  redirect('/secure/admin/signup')
}
