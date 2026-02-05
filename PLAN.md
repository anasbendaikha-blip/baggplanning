# Plan d'implémentation — Assistant Planning

## Fichiers à créer

### 1. `lib/planning-generator.ts` — Algorithme de génération
- Types: `Creneau`, `ContrainteEmploye`, `PlanningConstraints`, `Slot`, `ValidationResult`, `GenerationProgress`, `PlanningDraft`
- Templates créneaux pré-configurés (`standard`, `continu`, `garde`)
- Règles légales (`CODE_TRAVAIL` const)
- Fonctions: `filtrerDisponibles()`, `trierParPriorite()`, `affecterParRole()`, `verifierConformite()`, `equilibrerHeures()`, `genererPlanning()`
- Pre-diagnostic: `validerAvantGeneration()` → retourne bloquants + warnings
- Sauvegarde localStorage via clés `baggplanning_assistant_drafts` / `_last_config`

### 2. `app/titulaire/assistant-planning/page.tsx` — Stepper 4 étapes (page principale)
- Stepper horizontal (desktop) / dots (mobile)
- **Step 1**: Sélection période (date pickers HTML5) + jours actifs (toggle L-D)
- **Step 2**: Définition besoins par créneau (templates dropdown, cards éditables, min/max par rôle)
- **Step 3**: Contraintes employés (accordion par employé, heures min/max, repos, préférences, indispos auto-importées)
- **Step 4**: Validation & pré-diagnostic (résumé config, alertes bloquantes/warnings, bouton Générer)
- Loading state avec progress bar simulée
- Après génération → redirect vers `/assistant-planning/preview?draft=ID`
- Tout en `<style jsx global>` avec prefix `ap-`, tokens depuis `@/lib/ui-tokens`

### 3. `app/titulaire/assistant-planning/preview/page.tsx` — Aperçu résultat
- Stats globales (heures planifiées vs cible, employés mobilisés, équilibrage, conformité)
- Alertes/ajustements recommandés
- Gantt simplifié (réutilise le pattern visuel de planning/page.tsx)
- 3 boutons: Annuler (→ dashboard), Modifier (→ `/planning?mode=draft`), Valider (→ sauvegarde + `/planning`)

### 4. Mise à jour `app/titulaire/layout.tsx`
- Ajouter nav item: `{ href: '/titulaire/assistant-planning', label: 'Assistant', icon: '🤖' }`

## Approche technique

- **State management**: `useState` pour le stepper, config partagée entre steps via un seul state object `PlanningConstraints`
- **Données mock**: Importe `MOCK_EMPLOYEES`, `MOCK_DISPONIBILITES` depuis `@/lib/mock-data` pour pré-remplir les contraintes
- **Génération**: Algo greedy synchrone (pas de Web Worker pour le MVP), avec `setTimeout` pour simuler le progress
- **Persistence**: localStorage pour drafts, pas de Supabase
- **Design tokens**: `T`, `ROLE_PALETTE`, `ACTIVITY_COLORS` depuis `@/lib/ui-tokens`
- **CSS prefix**: `ap-` pour assistant-planning, `apv-` pour preview
- **Responsive**: Mobile-first, stepper dots < 768px, stepper bar >= 768px

## Ordre d'implémentation

1. `lib/planning-generator.ts` (types + algorithme + validation)
2. `app/titulaire/assistant-planning/page.tsx` (stepper + 4 steps UI + génération)
3. `app/titulaire/assistant-planning/preview/page.tsx` (résultat + actions)
4. Mise à jour layout nav
5. Build check
