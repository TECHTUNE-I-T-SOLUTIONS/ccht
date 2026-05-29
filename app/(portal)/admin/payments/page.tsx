'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

export default function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, successful: 0, pending: 0 })
  const supabase = createClient()

  useEffect(() => {
    const getPayments = async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (data) {
        setPayments(data)
        setStats({
          total: data.reduce((sum, p) => sum + (p.status === 'success' ? p.amount : 0), 0),
          successful: data.filter(p => p.status === 'success').length,
          pending: data.filter(p => p.status === 'pending').length,
        })
      }
      setLoading(false)
    }

    getPayments()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 text-green-600'
      case 'pending':
        return 'bg-yellow-50 text-yellow-600'
      case 'failed':
        return 'bg-red-50 text-red-600'
      default:
        return 'bg-gray-50 text-gray-600'
    }
  }

  if (loading) return <div className="p-8">Loading payments...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Records</h1>
        <p className="text-muted-foreground">Track all student payments and transactions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">₦{stats.total.toLocaleString()}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Successful Payments</p>
          <p className="text-3xl font-bold">{stats.successful}</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <p className="text-3xl font-bold">{stats.pending}</p>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">No payments recorded</p>
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
                <th className="px-4 py-3 text-left font-semibold">Reference</th>
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
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">{payment.paystack_reference || 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
