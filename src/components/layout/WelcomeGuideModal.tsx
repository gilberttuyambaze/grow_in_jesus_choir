'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CircleHelp,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  Plus,
  Settings,
  ShieldCheck,
  Users,
  WalletCards
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { OnboardingProgress } from '@/lib/db'
import type { UserRole } from '@/types'
import { saveWorkspaceTourProgressAction } from '@/features/onboarding/actions'
import { getWorkspaceTourSteps } from '@/features/onboarding/config'
import { Modal } from '@/components/ui/Modal'

interface WelcomeGuideModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenNewRecord: () => void
  progress: OnboardingProgress
  userRole: UserRole
}

const stepIcons: Record<string, LucideIcon> = {
  layout: LayoutDashboard,
  wallet: WalletCards,
  chart: BarChart3,
  activity: Activity,
  category: BarChart3,
  review: ShieldCheck,
  members: Users,
  record: Plus,
  report: BarChart3,
  document: FileText,
  settings: Settings,
  bell: Bell
}

export function WelcomeGuideModal({
  isOpen,
  onClose,
  onOpenNewRecord,
  progress,
  userRole
}: WelcomeGuideModalProps) {
  const steps = React.useMemo(() => getWorkspaceTourSteps(userRole), [userRole])
  const [currentStep, setCurrentStep] = React.useState(() => (
    progress.status === 'in_progress'
      ? Math.min(Math.max(progress.currentStep, 0), steps.length - 1)
      : 0
  ))
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const wasOpen = React.useRef(false)
  const initializedProgress = React.useRef(false)

  React.useEffect(() => {
    if (isOpen && !wasOpen.current) {
      setCurrentStep(progress.status === 'in_progress'
        ? Math.min(Math.max(progress.currentStep, 0), steps.length - 1)
        : 0)
      setSaveError(null)
    }
    wasOpen.current = isOpen
  }, [isOpen, progress.currentStep, progress.status, steps.length])

  React.useEffect(() => {
    if (!isOpen || progress.status !== 'not_started' || initializedProgress.current) return
    initializedProgress.current = true
    setIsSaving(true)
    void saveWorkspaceTourProgressAction(0)
      .then((result) => {
        if (!result.success) setSaveError(result.error || 'Tour progress could not be saved. Please try again.')
      })
      .catch(() => setSaveError('Tour progress could not be saved. Please try again.'))
      .finally(() => setIsSaving(false))
  }, [isOpen, progress.status])

  const persist = React.useCallback(async (stepIndex: number, completed = false) => {
    setIsSaving(true)
    setSaveError(null)
    try {
      const result = await saveWorkspaceTourProgressAction(stepIndex, completed)
      if (!result.success) {
        setSaveError(result.error || 'Tour progress could not be saved. Please try again.')
        return false
      }
      return true
    } catch {
      setSaveError('Tour progress could not be saved. Please try again.')
      return false
    } finally {
      setIsSaving(false)
    }
  }, [])

  const handleClose = React.useCallback(() => {
    if (!isSaving) onClose()
  }, [isSaving, onClose])

  const moveToStep = async (nextStep: number) => {
    if (nextStep < 0 || nextStep >= steps.length || nextStep === currentStep) return
    if (await persist(nextStep)) setCurrentStep(nextStep)
  }

  const handleContinue = async () => {
    if (currentStep < steps.length - 1) {
      await moveToStep(currentStep + 1)
      return
    }
    if (await persist(currentStep, true)) onClose()
  }

  const handleOpenAction = () => {
    if (isSaving) return
    onClose()
    onOpenNewRecord()
  }

  const step = steps[currentStep]
  const Icon = stepIcons[step.icon] || CircleHelp
  const progressPercent = Math.round(((currentStep + 1) / steps.length) * 100)
  const isLastStep = currentStep === steps.length - 1

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Your workspace, step by step"
      description="Learn what the dashboard shows, what each status means, and where to find your tools. Your place is saved as you go."
      maxWidth="lg"
    >
      <div className="space-y-5 pt-1">
        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-[11px] font-semibold text-slate-500">
            <span>{step.section}</span>
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Tour progress"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={currentStep + 1}
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-600 transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <article className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm">
          <div className="mb-4 flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-indigo-600">
                {step.section}
              </p>
              <h3 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
                {step.title}
              </h3>
            </div>
          </div>

          <p className="text-sm leading-6 text-slate-600">
            {step.description}
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-3.5">
              <h4 className="mb-1 text-xs font-bold text-slate-900">What it indicates</h4>
              <p className="text-xs leading-5 text-slate-600">{step.meaning}</p>
            </div>
            <div className="rounded-2xl bg-indigo-50/70 p-3.5">
              <h4 className="mb-1 text-xs font-bold text-indigo-900">Helpful tip</h4>
              <p className="text-xs leading-5 text-indigo-900/75">{step.tip}</p>
            </div>
          </div>

          {(step.href || step.action === 'new-record') && (
            <div className="mt-4">
              {step.action === 'new-record' ? (
                <button
                  type="button"
                  onClick={handleOpenAction}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  <Plus className="h-4 w-4" />
                  {step.actionLabel}
                </button>
              ) : step.href ? (
                <Link
                  href={step.href}
                  onClick={handleClose}
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 text-xs font-semibold text-indigo-700 transition-colors hover:bg-indigo-50"
                >
                  {step.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          )}
        </article>

        {saveError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-700" role="alert">
            {saveError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => void moveToStep(currentStep - 1)}
              disabled={currentStep === 0 || isSaving}
              className="inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="min-h-10 rounded-full px-4 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              Save and close
            </button>
          </div>

          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={isSaving}
            className="brand-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-6 text-xs font-semibold text-white disabled:cursor-wait"
          >
            {isSaving ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : isLastStep ? (
              <>
                <Check className="h-4 w-4" />
                Finish tour
              </>
            ) : (
              <>
                Next step
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  )
}
