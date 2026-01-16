# 🗓️ BaggPlanning - Guide d'installation Backend

## 📋 Étapes d'installation

### 1. Configurer Supabase

#### 1.1 Créer les tables
1. Aller sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionner le projet `BaggPlanning`
3. Aller dans **SQL Editor**
4. Copier le contenu de `supabase-schema.sql`
5. Exécuter le script

#### 1.2 Créer les utilisateurs de test
1. Aller dans **Authentication > Users**
2. Cliquer sur **Add User > Create New User**
3. Créer ces comptes:

| Email | Mot de passe | Type |
|-------|--------------|------|
| titulaire@pharmacie.fr | demo123 | Titulaire |
| anas@email.com | demo123 | Employé |
| celya@email.com | demo123 | Employé |

#### 1.3 Lier les utilisateurs
1. Retourner dans **SQL Editor**
2. Exécuter:
```sql
SELECT id, email FROM auth.users;
```
3. Copier les UUID
4. Exécuter `supabase-seed.sql` en remplaçant les UUID

### 2. Configurer l'application Next.js

#### 2.1 Installer les dépendances
```bash
cd baggplanning
npm install @supabase/supabase-js
```

#### 2.2 Créer le fichier .env.local
```bash
cp .env.example .env.local
```

Remplir avec vos clés Supabase (Settings > API):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

#### 2.3 Copier les fichiers
```bash
# Types
cp types/database.ts app/types/

# Lib
cp lib/supabase.ts app/lib/
cp lib/auth-context.tsx app/lib/
cp -r lib/hooks app/lib/

# Pages
cp app/auth/login/page.tsx app/auth/login/
```

### 3. Mettre à jour le layout

Modifier `app/layout.tsx`:
```tsx
import { AuthProvider } from '@/lib/auth-context';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 4. Tester

```bash
npm run dev
```

Aller sur http://localhost:3000/auth/login

---

## 📁 Structure des fichiers

```
baggplanning/
├── lib/
│   ├── supabase.ts          # Client Supabase
│   ├── auth-context.tsx     # Contexte d'authentification
│   └── hooks/
│       ├── index.ts
│       ├── useEmployees.ts
│       ├── useDisponibilites.ts
│       ├── usePlanning.ts
│       └── useDemandes.ts
├── types/
│   └── database.ts          # Types TypeScript
├── app/
│   ├── auth/
│   │   └── login/
│   │       └── page.tsx     # Page de connexion
│   ├── employe/
│   │   └── page.tsx         # Espace employé
│   └── titulaire/
│       └── page.tsx         # Espace titulaire
└── .env.local               # Variables d'environnement
```

---

## 🔧 Hooks disponibles

### Employés
```tsx
const { employees, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
```

### Disponibilités
```tsx
const { disponibilite, saveDisponibilite } = useMyDisponibilites(employeeId, semaineDebut);
```

### Planning
```tsx
const { planning, addToPlanning, updatePlanning, removeFromPlanning } = useDayPlanning(date);
```

### Demandes
```tsx
const { demandes, createDemande } = useMyDemandes(employeeId);
const { demandes, updateDemandeStatus } = useDemandes('en_attente');
```

---

## ✅ Checklist

- [ ] Tables créées dans Supabase
- [ ] Utilisateurs créés dans Auth
- [ ] Utilisateurs liés dans table `users`
- [ ] Fichier .env.local configuré
- [ ] Dépendances installées
- [ ] Test de connexion OK
