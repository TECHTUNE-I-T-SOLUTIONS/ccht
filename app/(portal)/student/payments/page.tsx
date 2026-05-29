'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Download } from 'lucide-react'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const getPayments = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('student_id', user.id)
          .order('created_at', { ascending: false })
        setPayments(data || [])
      }
      setLoading(false)
    }

    getPayments()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50'
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) return <div className="p-8">Loading payment history...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Fee Payments</h1>
          <p className="text-muted-foreground">View and manage your payment records</p>
        </div>
        <Button className="gap-2">
          <CreditCard className="w-4 h-4" />
          Make Payment
        </Button>
      </div>

      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <p className="text-lg text-muted-foreground">No payment records</p>
          <p className="text-sm text-muted-foreground mt-2">Start by making your first payment</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Date</th>
                <th className="px-4 py-3 text-left font-semibold">Amount</th>
                <th className="px-4 py-3 text-left font-semibold">Description</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">{new Date(payment.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-bold">₦{payment.amount.toLocaleString()}</td>
                  <td className="px-4 py-3">{payment.description || 'Program Fee'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Download className="w-4 h-4" />
                      Receipt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
