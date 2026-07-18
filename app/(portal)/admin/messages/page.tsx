'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Mail, CheckCircle2, Circle, MoreVertical, Search } from 'lucide-react'
import { toast } from 'sonner'
import { getContactMessagesAction, markMessageReadAction } from '@/app/actions/admin/content-actions'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedMessage, setSelectedMessage] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getContactMessagesAction()
      if (res.success) {
        setMessages(res.data || [])
      } else {
        toast.error('Failed to load messages')
      }
    } catch (err) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id: string, isRead: boolean) => {
    const res = await markMessageReadAction(id, isRead)
    if (res.success) {
      loadData()
    } else {
      toast.error('Failed to update status')
    }
  }

  const viewMessage = (msg: any) => {
    setSelectedMessage(msg)
    if (!msg.is_read) {
      handleMarkRead(msg.id, true)
    }
  }

  const filtered = messages.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-8">
      <div className="rounded-[2.5rem] border border-border bg-[radial-gradient(circle_at_20%_20%,hsl(var(--primary)/0.12),transparent_30%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--accent-soft)))] p-8 md:p-10">
        <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Contact Messages</h1>
        <p className="mt-2 text-sm text-foreground/75">Read and respond to inquiries from the public website contact form.</p>
      </div>

      <Card className="rounded-[2rem] border bg-white dark:bg-slate-900 shadow-sm p-6">
        <div className="flex mb-6">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-none"
            />
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Sender</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">Loading messages...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8">No messages found.</TableCell></TableRow>
              ) : (
                filtered.map((msg) => (
                  <TableRow key={msg.id} className={!msg.is_read ? 'bg-primary/5 font-semibold' : ''}>
                    <TableCell>
                      {!msg.is_read ? <Circle className="h-3 w-3 fill-primary text-primary" /> : null}
                    </TableCell>
                    <TableCell>
                      <div>{msg.name}</div>
                      <div className="text-xs text-muted-foreground font-normal">{msg.email}</div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{msg.subject}</TableCell>
                    <TableCell className="text-sm text-muted-foreground font-normal">
                      {new Date(msg.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => viewMessage(msg)} className="rounded-xl">Read</Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 ml-2"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleMarkRead(msg.id, !msg.is_read)}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark as {msg.is_read ? 'Unread' : 'Read'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject}</DialogTitle>
            <DialogDescription className="pt-2 flex flex-col gap-1">
              <span className="font-semibold text-foreground">From: {selectedMessage?.name} ({selectedMessage?.email})</span>
              <span>Date: {selectedMessage && new Date(selectedMessage.created_at).toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm whitespace-pre-wrap leading-relaxed">
            {selectedMessage?.message}
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <Button variant="outline" onClick={() => setSelectedMessage(null)}>Close</Button>
            <Button asChild><a href={`mailto:${selectedMessage?.email}?subject=Re: ${selectedMessage?.subject}`}>Reply via Email</a></Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
