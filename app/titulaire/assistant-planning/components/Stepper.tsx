
// ============================================================
// 📁 app/titulaire/assistant-planning/components/Stepper.tsx
// ============================================================
// Stepper visuel pour l'assistant de génération
// ============================================================
 
'use client'
 
import { T } from '@/lib/ui-tokens'
 
// ============================================================
// Types
// ============================================================
 
interface Step {
  id: number
  label: string
  shortLabel: string
  icon: string
  status: 'pending' | 'active' | 'completed' | 'error'
}
 
interface AssistantStepperProps {
  currentStep: number
  steps: Step[]
  onStepClick?: (stepId: number) => void
}
 
// ============================================================
// Composant
// ============================================================
 
export function AssistantStepper({ currentStep, steps, onStepClick }: AssistantStepperProps) {
  return (
    <div className="stepper-container">
      {/* Desktop - Horizontal */}
      <div className="stepper-desktop">
        <div className="stepper-track">
          {/* Ligne de progression */}
          <div className="stepper-line" />
          <div
            className="stepper-line-progress"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
 
          {/* Steps */}
          {steps.map((step) => {
            const isActive = step.status === 'active'
            const isCompleted = step.status === 'completed'
            const isError = step.status === 'error'
            const isPending = step.status === 'pending'
 
            return (
              <button
                key={step.id}
                onClick={() => !isPending && onStepClick?.(step.id)}
                disabled={isPending}
                className={`stepper-step ${step.status}`}
              >
                {/* Cercle */}
                <div className={`stepper-circle ${step.status}`}>
                  {isCompleted ? (
                    <span className="stepper-check">✓</span>
                  ) : isError ? (
                    <span className="stepper-error-icon">!</span>
                  ) : (
                    <span className="stepper-icon">{step.icon}</span>
                  )}
                </div>
 
                {/* Label */}
                <div className="stepper-label">
                  <p className={`stepper-label-text ${step.status}`}>
                    {step.label}
                  </p>
                  <p className="stepper-label-sub">
                    Étape {step.id}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
 
      {/* Mobile - Dots */}
      <div className="stepper-mobile">
        <div className="stepper-mobile-header">
          <div className="stepper-mobile-count">
            Étape {currentStep} / {steps.length}
          </div>
          <div className="stepper-dots">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`stepper-dot ${step.status}`}
              />
            ))}
          </div>
        </div>
 
        <div className="stepper-mobile-current">
          <div className="stepper-mobile-icon">
            {steps.find(s => s.id === currentStep)?.icon}
          </div>
          <h3 className="stepper-mobile-title">
            {steps.find(s => s.id === currentStep)?.label}
          </h3>
        </div>
      </div>
 
      {/* Styles */}
      <style jsx>{`
        .stepper-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 24px 16px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
        }
 
        /* Desktop */
        .stepper-desktop {
          display: block;
        }
 
        @media (max-width: 640px) {
          .stepper-desktop {
            display: none;
          }
        }
 
        .stepper-track {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
        }
 
        .stepper-line {
          position: absolute;
          top: 24px;
          left: 48px;
          right: 48px;
          height: 2px;
          background: ${T.border};
        }
 
        .stepper-line-progress {
          position: absolute;
          top: 24px;
          left: 48px;
          height: 2px;
          background: ${T.info};
          transition: width 0.5s ease;
        }
 
        .stepper-step {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          background: transparent;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
        }
 
        .stepper-step.pending {
          cursor: not-allowed;
          opacity: 0.5;
        }
 
        .stepper-step:not(.pending):hover .stepper-circle {
          transform: scale(1.05);
        }
 
        .stepper-circle {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          transition: all 0.3s;
          background: ${T.card};
          border: 2px solid ${T.border};
          color: ${T.muted};
        }
 
        .stepper-circle.active {
          background: ${T.info};
          border-color: ${T.info};
          color: white;
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
 
        .stepper-circle.completed {
          background: ${T.info};
          border-color: ${T.info};
          color: white;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }
 
        .stepper-circle.error {
          background: ${T.dangerLt};
          border-color: ${T.danger};
          color: ${T.danger};
        }
 
        .stepper-check {
          font-size: 20px;
          font-weight: 700;
        }
 
        .stepper-error-icon {
          font-size: 20px;
          font-weight: 700;
        }
 
        .stepper-icon {
          font-size: 20px;
        }
 
        .stepper-label {
          text-align: center;
        }
 
        .stepper-label-text {
          font-size: 13px;
          font-weight: 600;
          margin: 0;
          color: ${T.muted};
          transition: color 0.2s;
        }
 
        .stepper-label-text.active {
          color: ${T.info};
        }
 
        .stepper-label-text.completed {
          color: ${T.text};
        }
 
        .stepper-label-text.error {
          color: ${T.danger};
        }
 
        .stepper-label-sub {
          font-size: 11px;
          color: ${T.muted};
          margin: 2px 0 0 0;
        }
 
        /* Mobile */
        .stepper-mobile {
          display: none;
        }
 
        @media (max-width: 640px) {
          .stepper-mobile {
            display: block;
          }
        }
 
        .stepper-mobile-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
 
        .stepper-mobile-count {
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
        }
 
        .stepper-dots {
          display: flex;
          gap: 6px;
        }
 
        .stepper-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${T.border};
          transition: all 0.3s;
        }
 
        .stepper-dot.active {
          width: 32px;
          border-radius: 4px;
          background: ${T.info};
        }
 
        .stepper-dot.completed {
          background: ${T.info};
        }
 
        .stepper-dot.error {
          background: ${T.danger};
        }
 
        .stepper-mobile-current {
          text-align: center;
        }
 
        .stepper-mobile-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }
 
        .stepper-mobile-title {
          font-size: 18px;
          font-weight: 700;
          color: ${T.text};
          margin: 0;
        }
      `}</style>
    </div>
  )
}
 
export default AssistantStepper
 