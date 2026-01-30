// ============================================================
// GUIDE D'INTÉGRATION - StudentSidebar dans Planning (supporte alias @/... et imports relatifs)
// ============================================================

// 1) Import du composant
// Dans app/titulaire/planning/page.tsx, ajouter en haut :
//
// ✅ Si l'alias "@" est configuré (tsconfig paths), utilisez :
// import StudentSidebar from '@/components/planning/StudentSidebar'
//
// ✅ Sinon (si vous avez une erreur du type "Cannot find module '@/..."), utilisez un import relatif :
// import StudentSidebar from '../../../components/planning/StudentSidebar'

import StudentSidebar from '@/components/planning/StudentSidebar'

// 2) Dans le rendu du planning, remplacer l'ancienne sidebar par :

{showSidebar && (
  <StudentSidebar
    selectedDay={selectedDay}
    weekDayNames={currentWeekDayNames}
    onAssign={(assignment) => {
      // Traiter l'assignation
      console.log('Assignation:', assignment)

      // Exemple: persister dans le store (1 assignation = 1 ou plusieurs slots)
      const dateStr = currentWeekDates[assignment.dayIndex]
      assignment.slots.forEach((slot) => {
        addStudentAssignment({
          studentId: assignment.studentId,
          date: dateStr,
          startTime: slot.startTime,
          endTime: slot.endTime,
          hasPause: !!slot.pauseStart,
          pauseStart: slot.pauseStart || undefined,
          pauseDuration: slot.pauseDuration || undefined,
        })
      })

      // UI feedback
      showToast(`✓ ${assignment.studentName} assigné`)
    }}
    onClose={() => setShowSidebar(false)}
  />
)}

// ⚠️ Pré-requis dans Planning (page.tsx)
// - selectedDay: number (0=Lun .. 5=Sam)
// - currentWeekDayNames: string[] (ex: getWeekDayNames(weekStart))
// - currentWeekDates: string[] (YYYY-MM-DD, ex: getWeekDates(weekStart))
// - showToast: (msg: string) => void
// - addStudentAssignment: import depuis '@/lib/demo-store'

// 3) Structure du layout Planning avec sidebar :

/*
<div style={{ display: 'flex', height: 'calc(100vh - 120px)' }}>

  // Sidebar Étudiants (gauche)
  {showSidebar && (
    <StudentSidebar
      selectedDay={selectedDay}
      weekDayNames={currentWeekDayNames}
      onAssign={handleStudentAssign}
      onClose={() => setShowSidebar(false)}
    />
  )}

  // Planning principal (centre)
  <main style={{ flex: 1, overflow: 'auto' }}>
    // Gantt / Grille planning
  </main>

  // Panel édition employé (droite)
  {editPanelOpen && selectedEmp && (
    <EditPanel />
  )}

</div>
*/

// 4) Props du composant StudentSidebar :

interface StudentSidebarProps {
  // Jour sélectionné (0 = Lundi, 5 = Samedi)
  selectedDay: number
  
  // Noms des jours de la semaine ["Lun 26", "Mar 27", ...]
  weekDayNames: string[]
  
  // Callback quand un étudiant est assigné
  onAssign?: (assignment: {
    studentId: string
    studentName: string
    dayIndex: number
    slots: Array<{
      startTime: string
      endTime: string
      pauseStart?: string
      pauseDuration?: number
    }>
  }) => void
  
  // Callback pour fermer la sidebar
  onClose?: () => void
}

// 5) Exemple de handler onAssign avec le store :

type StudentSidebarAssignment = {
  studentId: string
  studentName: string
  dayIndex: number
  slots: Array<{
    startTime: string
    endTime: string
    pauseStart?: string
    pauseDuration?: number
  }>
}

const handleStudentAssign = (assignment: StudentSidebarAssignment) => {
  const dateStr = currentWeekDates[assignment.dayIndex]

  // 1) Persister chaque slot (heures simples ou fractionnées)
  assignment.slots.forEach((slot) => {
    addStudentAssignment({
      studentId: assignment.studentId,
      date: dateStr,
      startTime: slot.startTime,
      endTime: slot.endTime,
      hasPause: !!slot.pauseStart,
      pauseStart: slot.pauseStart || undefined,
      pauseDuration: slot.pauseDuration || undefined,
    })
  })

  // 2) Recharger si vous avez un state local (optionnel)
  // setAssignments(getStudentAssignmentsForDate(dateStr))

  // 3) Feedback
  showToast(`✓ ${assignment.studentName} assigné`)
}