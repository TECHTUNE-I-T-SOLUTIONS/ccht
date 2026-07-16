'use client'

import { Lock, AlertCircle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import Link from 'next/link'

interface StageGateProps {
  currentStage: string
  requiredStage: string
  requiredActionLabel: string
  requiredActionLink: string
  featureName: string
  description?: string
}

export function StageGate({
  currentStage,
  requiredStage,
  requiredActionLabel,
  requiredActionLink,
  featureName,
  description = `To access ${featureName}, you need to complete the previous step first.`,
}: StageGateProps) {
  const stageOrder = ['signup', 'payment', 'documents', 'exam', 'admission_fee', 'migration']
  const currentStageIndex = stageOrder.indexOf(currentStage)
  const requiredStageIndex = stageOrder.indexOf(requiredStage)
  
  const isLocked = currentStageIndex < requiredStageIndex

  if (!isLocked) {
    return null
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full">
          {featureName}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border-border bg-white dark:bg-slate-900">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/20">
              <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle>Feature Locked</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-3">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="my-4 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Complete the required step to unlock this feature
              </p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                You are currently at stage: <span className="font-semibold">{currentStage}</span>
              </p>
            </div>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Link href={requiredActionLink} className="bg-primary hover:bg-primary/90">
              {requiredActionLabel}
            </Link>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface StageGateCardProps {
  currentStage: string
  requiredStage: string
  requiredActionLabel: string
  requiredActionLink: string
  featureName: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
}

export function StageGateCard({
  currentStage,
  requiredStage,
  requiredActionLabel,
  requiredActionLink,
  featureName,
  description = `To access ${featureName}, you need to complete the previous step first.`,
  icon: Icon,
}: StageGateCardProps) {
  const stageOrder = ['signup', 'payment', 'documents', 'exam', 'admission_fee', 'migration']
  const currentStageIndex = stageOrder.indexOf(currentStage)
  const requiredStageIndex = stageOrder.indexOf(requiredStage)
  
  const isLocked = currentStageIndex < requiredStageIndex

  if (!isLocked) {
    return null
  }

  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-900/30 dark:bg-amber-950/20">
      <div className="p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-amber-100 p-3 dark:bg-amber-900/20">
            {Icon ? <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" /> : <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">{featureName} is Locked</h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">{description}</p>
            <div className="mt-4">
              <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
                <Link href={requiredActionLink}>
                  {requiredActionLabel}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
