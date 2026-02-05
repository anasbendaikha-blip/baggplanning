// ============================================================
// 📁 app/titulaire/assistant-planning/hooks/useStepper.ts
// ============================================================

import { useState, useCallback, useMemo } from 'react'

// ============================================================
// Types
// ============================================================

export type StepStatus = 'pending' | 'active' | 'completed' | 'error'

export interface Step {
  id: number
  label: string
  shortLabel: string
  icon: string
  status: StepStatus
}

export interface UseStepperOptions {
  totalSteps: number
  initialStep?: number
}

export interface UseStepperReturn {
  currentStep: number
  totalSteps: number
  steps: Step[]
  isFirstStep: boolean
  isLastStep: boolean
  canGoNext: boolean
  canGoPrev: boolean
  goToStep: (step: number) => void
  goToNext: () => void
  goToPrev: () => void
  setStepValid: (step: number, isValid: boolean) => void
  setStepError: (step: number, hasError: boolean) => void
  reset: () => void
  stepValidation: Record<number, boolean>
}

// ============================================================
// Données des steps
// ============================================================

const STEPS_CONFIG: Omit<Step, 'status'>[] = [
  { id: 1, label: 'Période', shortLabel: 'Période', icon: '📅' },
  { id: 2, label: 'Créneaux', shortLabel: 'Créneaux', icon: '⏰' },
  { id: 3, label: 'Employés', shortLabel: 'Employés', icon: '👥' },
  { id: 4, label: 'Validation', shortLabel: 'Valider', icon: '✅' },
]

// ============================================================
// Hook
// ============================================================

export function useStepper(options: UseStepperOptions): UseStepperReturn {
  const { totalSteps, initialStep = 1 } = options

  const [currentStep, setCurrentStep] = useState(initialStep)

  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    for (let i = 1; i <= totalSteps; i++) {
      initial[i] = false
    }
    return initial
  })

  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    for (let i = 1; i <= totalSteps; i++) {
      initial[i] = false
    }
    return initial
  })

  const steps = useMemo((): Step[] => {
    return STEPS_CONFIG.slice(0, totalSteps).map((step) => {
      let status: StepStatus = 'pending'

      if (step.id === currentStep) {
        status = stepErrors[step.id] ? 'error' : 'active'
      } else if (step.id < currentStep) {
        status = stepValidation[step.id] ? 'completed' : 'error'
      } else {
        status = 'pending'
      }

      return { ...step, status }
    })
  }, [currentStep, stepValidation, stepErrors, totalSteps])

  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const canGoNext = currentStep < totalSteps && stepValidation[currentStep]
  const canGoPrev = currentStep > 1

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      if (step <= currentStep) {
        setCurrentStep(step)
      } else if (stepValidation[currentStep]) {
        let canAdvance = true
        for (let i = currentStep; i < step; i++) {
          if (!stepValidation[i]) {
            canAdvance = false
            break
          }
        }
        if (canAdvance) {
          setCurrentStep(step)
        }
      }
    }
  }, [currentStep, stepValidation, totalSteps])

  const goToNext = useCallback(() => {
    if (canGoNext) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps))
    }
  }, [canGoNext, totalSteps])

  const goToPrev = useCallback(() => {
    if (canGoPrev) {
      setCurrentStep((prev) => Math.max(prev - 1, 1))
    }
  }, [canGoPrev])

  // ── CORRIGÉ : ne crée un nouvel objet que si la valeur change ──
  const setStepValid = useCallback((step: number, isValid: boolean) => {
    setStepValidation((prev) => {
      if (prev[step] === isValid) return prev  // ← pas de nouvel objet = pas de re-render
      return { ...prev, [step]: isValid }
    })
    if (isValid) {
      setStepErrors((prev) => {
        if (prev[step] === false) return prev  // ← idem
        return { ...prev, [step]: false }
      })
    }
  }, [])

  // ── CORRIGÉ : même pattern ──
  const setStepError = useCallback((step: number, hasError: boolean) => {
    setStepErrors((prev) => {
      if (prev[step] === hasError) return prev  // ← pas de re-render inutile
      return { ...prev, [step]: hasError }
    })
  }, [])

  const reset = useCallback(() => {
    setCurrentStep(initialStep)
    const resetValidation: Record<number, boolean> = {}
    const resetErrors: Record<number, boolean> = {}
    for (let i = 1; i <= totalSteps; i++) {
      resetValidation[i] = false
      resetErrors[i] = false
    }
    setStepValidation(resetValidation)
    setStepErrors(resetErrors)
  }, [initialStep, totalSteps])

  return {
    currentStep,
    totalSteps,
    steps,
    isFirstStep,
    isLastStep,
    canGoNext,
    canGoPrev,
    goToStep,
    goToNext,
    goToPrev,
    setStepValid,
    setStepError,
    reset,
    stepValidation
  }
}

export default useStepper