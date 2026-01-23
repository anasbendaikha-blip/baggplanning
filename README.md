# 🗄️ BaggPlanning - Configuration Supabase

Ce dossier contient tous les fichiers nécessaires pour connecter ton application Next.js à Supabase.

---

## 📁 Structure des fichiers

```
baggplanning-supabase-setup/
├── middleware.ts              → Middleware Next.js (racine du projet)
├── types/
│   └── supabase.ts            → Types TypeScript pour toutes les tables
├── utils/
│   └── supabase/
│       ├── client.ts          → Client Supabase (côté navigateur)
│       ├── server.ts          → Client Supabase (côté serveur)
│       └── middleware.ts      → Logique du middleware
└── lib/
    └── api/
        ├── employees.ts       → CRUD employés
        ├── availabilities.ts  → CRUD disponibilités
        ├── schedule.ts        → CRUD planning
        └── requests.ts        → CRUD demandes
```

---

## 🚀 Installation

### Étape 1 : Installer les dépendances

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### Étape 2 : Copier les fichiers

Copie chaque fichier dans ton projet Next.js aux emplacements indiqués :

| Fichier source | Destination dans ton projet |
|----------------|----------------------------|
| `middleware.ts` | `/middleware.ts` (racine) |
| `types/supabase.ts` | `/types/supabase.ts` |
| `utils/supabase/client.ts` | `/utils/supabase/client.ts` |
| `utils/supabase/server.ts` | `/utils/supabase/server.ts` |
| `utils/supabase/middleware.ts` | `/utils/supabase/middleware.ts` |
| `lib/api/employees.ts` | `/lib/api/employees.ts` |
| `lib/api/availabilities.ts` | `/lib/api/availabilities.ts` |
| `lib/api/schedule.ts` | `/lib/api/schedule.ts` |
| `lib/api/requests.ts` | `/lib/api/requests.ts` |

### Étape 3 : Vérifier le fichier `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Étape 4 : Vérifier le `tsconfig.json`

Assure-toi que les alias `@/` sont configurés :

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

## 📖 Utilisation

### Récupérer les employés (composant client)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { getEmployees } from '@/lib/api/employees'
import { Employee } from '@/types/supabase'

export default function EquipePage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getEmployees()
        setEmployees(data)
      } catch (error) {
        console.error('Erreur:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <p>Chargement...</p>

  return (
    <div>
      <h1>Équipe ({employees.length})</h1>
      {employees.map(emp => (
        <div key={emp.id}>
          {emp.initiales} - {emp.prenom} {emp.nom} ({emp.role})
        </div>
      ))}
    </div>
  )
}
```

### Ajouter un employé

```tsx
import { createEmployee } from '@/lib/api/employees'

async function handleAddEmployee() {
  try {
    const newEmployee = await createEmployee({
      prenom: 'Marie',
      nom: 'Dupont',
      initiales: 'MD',
      email: 'marie@email.com',
      role: 'Etudiant',
    })
    console.log('Employé créé:', newEmployee)
  } catch (error) {
    console.error('Erreur:', error)
  }
}
```

### Récupérer les disponibilités

```tsx
import { getAvailabilityMatrix, getCurrentWeekStart } from '@/lib/api/availabilities'

async function fetchAvailabilities() {
  const weekStart = getCurrentWeekStart() // Ex: "2026-01-20"
  const matrix = await getAvailabilityMatrix(weekStart)
  
  matrix.forEach(student => {
    console.log(`${student.employee_name} (${student.initiales})`)
    console.log('  Soumis:', student.has_submitted)
    for (let day = 0; day <= 5; day++) {
      const slots = student.days[day]
      if (slots) {
        console.log(`  Jour ${day}:`, slots.map(s => `${s.start_time}-${s.end_time}`).join(', '))
      }
    }
  })
}
```

### Assigner un étudiant au planning

```tsx
import { assignStudentToSchedule } from '@/lib/api/schedule'

async function assignStudent() {
  await assignStudentToSchedule(
    'uuid-employee',
    '2026-01-23',
    [
      { start_time: '08:00', end_time: '12:00' },
      { start_time: '14:00', end_time: '18:00' },
    ],
    { start: '12:00', duration: 30 } // Pause optionnelle
  )
}
```

### Gérer les demandes

```tsx
import { getPendingRequests, approveRequest, refuseRequest } from '@/lib/api/requests'

// Récupérer les demandes en attente
const requests = await getPendingRequests()

// Approuver avec un remplaçant
await approveRequest('uuid-request', 'uuid-replacement')

// Refuser
await refuseRequest('uuid-request')
```

---

## 🔧 Dépannage

### Erreur "relation does not exist"

→ Les tables n'existent pas dans Supabase. Exécute le script SQL.

### Erreur "permission denied"

→ Vérifie que RLS est configuré avec les bonnes policies.

### Erreur "Invalid API key"

→ Vérifie les variables d'environnement dans `.env.local`.

### Les données ne s'affichent pas

1. Ouvre la console du navigateur (F12)
2. Vérifie les erreurs réseau
3. Vérifie que les données existent dans Supabase (Table Editor)

---

## 📊 Tables Supabase

| Table | Description |
|-------|-------------|
| `pharmacies` | Pharmacies (multi-tenant) |
| `employees` | Employés (tous rôles) |
| `weekly_schedules` | Planning fixe hebdomadaire |
| `availabilities` | Disponibilités étudiants |
| `requests` | Demandes (congés, échanges, maladies) |
| `schedule_entries` | Planning assigné par le titulaire |
| `gardes` | Gardes de nuit/weekend |

---

## ✅ Checklist de vérification

- [ ] Dépendances installées (`@supabase/supabase-js`, `@supabase/ssr`)
- [ ] Variables d'environnement configurées
- [ ] Script SQL exécuté dans Supabase
- [ ] Fichiers copiés aux bons emplacements
- [ ] Aliases `@/` configurés dans `tsconfig.json`
- [ ] Test de connexion réussi (employés affichés)

---

**Besoin d'aide ?** Partage l'erreur exacte de ta console et on la résout ! 🚀
