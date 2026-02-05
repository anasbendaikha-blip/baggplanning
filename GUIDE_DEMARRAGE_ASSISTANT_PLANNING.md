# ⚡ Guide de démarrage rapide - Assistant Planning

## 🎯 Objectif
Créer un planning hebdomadaire automatiquement en 4 étapes simples.

---

## 📋 Checklist avant de commencer

- [ ] Avoir des employés dans votre équipe
- [ ] Connaître vos besoins en personnel par créneau
- [ ] Avoir défini les disponibilités de vos employés (optionnel)

---

## 🚀 Les 4 étapes

### Étape 1️⃣ : Période & Jours (30 secondes)

**Que faire ?**
1. Sélectionner la date de début (ex: lundi prochain)
2. Sélectionner la date de fin (ex: dimanche)
3. Cocher les jours travaillés (Lun-Ven par défaut)

**Tips :**
- Utiliser le raccourci "Lun-Ven" pour gagner du temps
- Maximum 31 jours pour une génération efficace

---

### Étape 2️⃣ : Créneaux (2-3 minutes)

**Que faire ?**
1. Choisir un template pré-configuré :
   - **Horaires standards** → Matin (9h-13h) + AM (14h-19h)
   - **Pharmacie de garde** → 24/7 avec rotation
   - **Personnalisé** → Créer vos propres créneaux

2. Ajuster les besoins par rôle :
   - **Pharmacien** : minimum 1 (obligatoire légal)
   - **Préparateur** : selon votre activité
   - **Apprenti** : si applicable

**Tips :**
- Dupliquer un créneau pour gagner du temps
- Vérifier que tous les créneaux ont au moins 1 pharmacien

---

### Étape 3️⃣ : Contraintes employés (1-2 minutes)

**Que faire ?**
1. Cliquer sur un employé pour déplier ses options
2. Ajuster (optionnel) :
   - Heures min/max par semaine
   - Jours de repos fixes
   - Préférences de créneaux

**Tips :**
- Laisser vide si pas de préférence particulière
- Les préférences sont indicatives, pas bloquantes

---

### Étape 4️⃣ : Validation (15 secondes)

**Que faire ?**
1. Vérifier le résumé (période, créneaux, employés)
2. Lire les alertes s'il y en a
3. Cliquer sur "🚀 Générer le planning"

**Tips :**
- Si erreur bloquante → retourner à l'étape concernée
- Les warnings ne bloquent pas la génération

---

## ✨ Après génération

### Page de preview

Vous arrivez sur une page avec :
- **Statistiques** : heures totales, équilibrage, conformité
- **Recommandations** : suggestions d'ajustements
- **3 choix** :
  1. **Annuler** → Tout supprimer et recommencer
  2. **Modifier** → Ajustements manuels (drag & drop)
  3. **Valider** → Appliquer le planning définitif

---

## 🎓 Exemples d'utilisation

### Cas 1 : Pharmacie urbaine standard

```
Période     : 7 jours (Lun-Dim)
Jours actifs: Lun-Sam (fermé dimanche)
Template    : Horaires standards
Employés    : 6 (2 pharmaciens, 4 préparateurs)
Résultat    : Planning généré en 3 secondes
```

### Cas 2 : Pharmacie de garde

```
Période     : 7 jours
Jours actifs: Tous les jours
Template    : Pharmacie de garde (24/7)
Employés    : 8 (rotation jour/nuit)
Résultat    : Planning avec gardes équilibrées
```

### Cas 3 : Période de congés

```
Période     : 14 jours
Jours actifs: Lun-Ven
Template    : Personnalisé (journée continue)
Employés    : 5 (3 en congé sur la période)
Résultat    : Alerte sur sous-effectif + solutions
```

---

## ⚠️ Erreurs courantes & solutions

### "Aucun créneau défini"
**Cause** : Étape 2 sautée  
**Solution** : Retourner à l'étape 2 et sélectionner un template

### "Créneau X : absence de pharmacien"
**Cause** : Pas de pharmacien min=1  
**Solution** : Ajouter au moins 1 pharmacien dans les besoins

### "Couverture impossible"
**Cause** : Pas assez d'employés disponibles  
**Solutions** :
- Réduire les besoins minimums
- Annuler un congé
- Recruter un remplaçant

### Planning déséquilibré
**Cause** : Contraintes trop strictes  
**Solution** : Relâcher les préférences ou ajuster manuellement après

---

## 🔧 Paramètres recommandés

### Pour une semaine type

```yaml
Période: 7 jours
Jours: Lun-Sam
Créneaux: 2 par jour (Matin + AM)
Pharmacien: 1-2 par créneau
Préparateur: 2-4 par créneau
Heures/employé: 35-39h
```

### Pour un mois

```yaml
Période: 30 jours
Jours: Lun-Ven (ou Lun-Sam)
Créneaux: Standards
Pharmacien: 1-2 par créneau
Préparateur: 3-5 par créneau
Heures/employé: 35-39h
```

---

## 🎨 Astuces d'expert

### Gagner du temps
1. Utiliser les **templates pré-configurés**
2. Dupliquer les créneaux similaires
3. Appliquer les contraintes "à tous" (si même rôle)

### Optimiser le résultat
1. Définir des **préférences claires** (matin/soir)
2. Spécifier les **jours de repos fixes**
3. Laisser l'algo **équilibrer les heures**

### Gérer les conflits
1. Vérifier les **disponibilités** avant génération
2. Accepter les **warnings non bloquants**
3. Ajuster **manuellement** si besoin après

---

## 📞 Aide & Support

### Si ça ne fonctionne pas
1. Vérifier que tous les champs obligatoires sont remplis
2. Lire attentivement les messages d'erreur
3. Retourner à l'étape concernée

### Limitations actuelles (MVP)
- Maximum 31 jours par génération
- Pas d'import calendrier externe
- Pas d'IA prédictive (Phase 2)
- Pas de multi-pharmacies (Phase 2)

### Prochaines fonctionnalités
- 🔄 Sauvegarde de templates personnalisés
- 📊 Historique des générations
- 🤖 Suggestions IA basées sur l'historique
- 📱 Notifications push aux employés

---

## ✅ Checklist post-génération

Avant de valider le planning :

- [ ] Vérifier l'équilibrage des heures
- [ ] Lire toutes les recommandations
- [ ] Valider la conformité légale (100%)
- [ ] Vérifier les alertes warnings
- [ ] Tester les ajustements manuels si besoin

---

## 🎉 Félicitations !

Vous êtes maintenant prêt à utiliser l'assistant de planning.

**Temps total moyen** : 5-7 minutes pour un planning complet  
**Vs création manuelle** : 1-2 heures

**Gain de temps** : **~85% !** 🚀

---

**Bon planning !** 📅✨