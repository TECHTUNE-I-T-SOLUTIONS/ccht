'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Receipt, Plus, Search, Calendar, DollarSign, User, CheckCircle, XCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Aspirant = {
  id: string
  profile_id: string
  first_name: string
  last_name: string
  email: string
  jamb_reg_no: string
  application_fee_paid: boolean
  admission_fee_paid: boolean
  created_at: string
}

type ManualPayment = {
  id: string
  aspirant_id: string
  amount: number
  payment_method: string
  status: string
  description: string
  paid_at: string
  payment_type: 'application' | 'admission'
}

export default function OfflinePaymentPage() {
  const [aspirants, setAspirants] = useState<Aspirant[]>([])
  const [manualPayments, setManualPayments] = useState<ManualPayment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedAspirant, setSelectedAspirant] = useState<Aspirant | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    paymentType: 'application',
    amount: '',
    description: '',
    paymentMethod: 'cash',
    reference: '',
    paidAt: new Date().toISOString().split('T')[0]
  })
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load aspirants
      const { data: aspirantsData, error: aspirantsError } = await supabase
        .from('aspirant_profiles')
        .select(`
          profile_id,
          jamb_reg_no,
          application_fee_paid,
          admission_fee_paid,
          created_at,
          profiles!inner(id, first_name, last_name, email)
        `)
        .order('created_at', { ascending: false })

      if (aspirantsError) throw aspirantsError

      const formattedAspirants = (aspirantsData || []).map((a: any) => ({
        id: a.profiles.id,
        profile_id: a.profile_id,
        first_name: a.profiles.first_name,
        last_name: a.profiles.last_name,
        email: a.profiles.email,
        jamb_reg_no: a.jamb_reg_no,
        application_fee_paid: a.application_fee_paid,
        admission_fee_paid: a.admission_fee_paid,
        created_at: a.created_at
      }))

      setAspirants(formattedAspirants)

      // Load manual payments
      const paymentsResponse = await fetch('/api/v1/admin/management/aspirants/manual-payment')
      const paymentsData = await paymentsResponse.json()
      
      if (paymentsData.success) {
        setManualPayments(paymentsData.data)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAspirants = aspirants.filter(aspirant => {
    const searchLower = searchTerm.toLowerCase()
    return (
      aspirant.first_name?.toLowerCase().includes(searchLower) ||
      aspirant.last_name?.toLowerCase().includes(searchLower) ||
      aspirant.email?.toLowerCase().includes(searchLower) ||
      aspirant.jamb_reg_no?.toLowerCase().includes(searchLower)
    )
  })

  const handlePaymentSubmit = async () => {
    if (!selectedAspirant) return

    try {
      setSubmitting(true)

      const response = await fetch('/api/v1/admin/management/aspirants/manual-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aspirantId: selectedAspirant.profile_id,
          paymentType: paymentForm.paymentType,
          amount: parseFloat(paymentForm.amount),
          description: paymentForm.description,
          paymentMethod: paymentForm.paymentMethod,
          reference: paymentForm.reference,
          paidAt: paymentForm.paidAt
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh data
        await loadData()
        setShowPaymentModal(false)
        setSelectedAspirant(null)
        setPaymentForm({
          paymentType: 'application',
          amount: '',
          description: '',
          paymentMethod: 'cash',
          reference: '',
          paidAt: new Date().toISOString().split('T')[0]
        })
      } else {
        alert(data.error || 'Failed to record payment')
      }
    } catch (error) {
      console.error('Error recording payment:', error)
      alert('Failed to record payment')
    } finally {
      setSubmitting(false)
    }
  }

  const openPaymentModal = (aspirant: Aspirant) => {
    setSelectedAspirant(aspirant)
    // Set default amount based on payment type
    const defaultAmount = paymentForm.paymentType === 'application' ? 6500 : 30000
    setPaymentForm({
      ...paymentForm,
      amount: defaultAmount.toString()
    })
    setShowPaymentModal(true)
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      success: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
      failed: 'bg-red-500/10 text-red-600 border-red-500/20',
    }
    return colors[status] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manual Payment Entry</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record offline payments for aspirants (cash, bank transfer, etc.)
          </p>
        </div>
        <Button 
          className="gap-2 border border-primary hover:text-blue-400 hover:shadow-lg hover:shadow-blue-950"
          onClick={() => loadData()}
        >
          <Receipt className="h-4 w-4" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Offline Payments</p>
              <p className="text-2xl font-bold mt-1">{manualPayments.length}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Receipt className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Application Fee Payments</p>
              <p className="text-2xl font-bold mt-1">
                {manualPayments.filter(p => p.payment_type === 'application').length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Admission Fee Payments</p>
              <p className="text-2xl font-bold mt-1">
                {manualPayments.filter(p => p.payment_type === 'admission').length}
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search and Aspirants List */}
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search aspirants by name, email, or JAMB reg number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading aspirants...</div>
        ) : (
          <div className="space-y-4">
            {filteredAspirants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No aspirants found matching your search
              </div>
            ) : (
              filteredAspirants.map((aspirant) => (
                <div
                  key={aspirant.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {aspirant.first_name} {aspirant.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{aspirant.email}</p>
                      <p className="text-xs text-muted-foreground">JAMB: {aspirant.jamb_reg_no || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <Badge className={aspirant.application_fee_paid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}>
                        {aspirant.application_fee_paid ? 'App Fee Paid' : 'App Fee Pending'}
                      </Badge>
                      <Badge className={aspirant.admission_fee_paid ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}>
                        {aspirant.admission_fee_paid ? 'Adm Fee Paid' : 'Adm Fee Pending'}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => openPaymentModal(aspirant)}
                    >
                      <Plus className="h-4 w-4" />
                      Record Offline Payment
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* Recent Manual Payments */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Offline Payments</h2>
        {manualPayments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No manual payments recorded yet
          </div>
        ) : (
          <div className="space-y-3">
            {manualPayments.slice(0, 10).map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Receipt className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {payment.payment_type === 'application' ? 'Application Fee' : 'Admission Fee'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Paid: {new Date(payment.paid_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">₦{payment.amount.toLocaleString()}</p>
                  <Badge className={getPaymentStatusColor(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-black">
          <DialogHeader>
            <DialogTitle>Record Offline Payment</DialogTitle>
          </DialogHeader>
          {selectedAspirant && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{selectedAspirant.first_name} {selectedAspirant.last_name}</p>
                <p className="text-sm text-muted-foreground">{selectedAspirant.email}</p>
                <p className="text-xs text-muted-foreground">JAMB: {selectedAspirant.jamb_reg_no || 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <Label>Payment Type</Label>
                <Select
                  value={paymentForm.paymentType}
                  onValueChange={(value) => {
                    setPaymentForm({
                      ...paymentForm,
                      paymentType: value,
                      amount: value === 'application' ? '6500' : '30000'
                    })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="application">Application Fee (₦6,500)</SelectItem>
                    <SelectItem value="admission">Admission Fee (₦30,000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Amount (₦)</Label>
                <Input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentForm.paymentMethod}
                  onValueChange={(value) => setPaymentForm({ ...paymentForm, paymentMethod: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="paystack">Paystack</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Reference Number (Optional)</Label>
                <Input
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  placeholder="Enter reference number"
                />
              </div>

              <div className="space-y-2">
                <Label>Payment Date</Label>
                <Input
                  type="date"
                  value={paymentForm.paidAt}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Description (Optional)</Label>
                <Input
                  value={paymentForm.description}
                  onChange={(e) => setPaymentForm({ ...paymentForm, description: e.target.value })}
                  placeholder="Enter description"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 border border-primary hover:shadow-lg hover:shadow-blue-600"
                  onClick={handlePaymentSubmit}
                  disabled={submitting || !paymentForm.amount}
                >
                  {submitting ? 'Recording...' : 'Record Payment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}