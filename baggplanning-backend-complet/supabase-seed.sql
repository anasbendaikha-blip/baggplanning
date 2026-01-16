-- ===========================================
-- BAGGPLANNING - Création des utilisateurs de test
-- Exécuter APRÈS avoir créé les utilisateurs via l'interface Supabase Auth
-- ===========================================

-- ÉTAPE 1: Créer les utilisateurs dans Supabase Dashboard
-- --------------------------------------------------------
-- Aller dans Authentication > Users > Invite User
-- 
-- Créer ces utilisateurs:
-- 1. titulaire@pharmacie.fr (mot de passe: demo123)
-- 2. anas@email.com (mot de passe: demo123)
-- 3. celya@email.com (mot de passe: demo123)
-- etc.

-- ÉTAPE 2: Récupérer les UUID des utilisateurs créés
-- --------------------------------------------------------
-- Exécuter cette requête pour voir les users créés:
SELECT id, email FROM auth.users ORDER BY created_at DESC;

-- ÉTAPE 3: Insérer dans la table users
-- --------------------------------------------------------
-- Remplacer les UUID par ceux obtenus à l'étape 2

-- Exemple (remplacer les UUID):
/*
INSERT INTO users (id, email, user_type, employee_id) VALUES
  ('uuid-du-titulaire', 'titulaire@pharmacie.fr', 'titulaire', NULL),
  ('uuid-anas', 'anas@email.com', 'employe', (SELECT id FROM employees WHERE email = 'anas@email.com')),
  ('uuid-celya', 'celya@email.com', 'employe', (SELECT id FROM employees WHERE email = 'celya@email.com'));
*/

-- ===========================================
-- SCRIPT AUTOMATIQUE (si vous avez les UUID)
-- ===========================================

-- Fonction pour créer un utilisateur automatiquement
CREATE OR REPLACE FUNCTION create_user_for_employee(
  p_auth_user_id UUID,
  p_email TEXT,
  p_is_titulaire BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
  v_employee_id INTEGER;
BEGIN
  -- Trouver l'employé correspondant
  SELECT id INTO v_employee_id FROM employees WHERE email = p_email;
  
  -- Insérer dans la table users
  INSERT INTO users (id, email, user_type, employee_id)
  VALUES (
    p_auth_user_id,
    p_email,
    CASE WHEN p_is_titulaire THEN 'titulaire' ELSE 'employe' END,
    CASE WHEN p_is_titulaire THEN NULL ELSE v_employee_id END
  )
  ON CONFLICT (id) DO UPDATE SET
    employee_id = EXCLUDED.employee_id;
    
  -- Mettre à jour l'employé avec le user_id
  IF NOT p_is_titulaire AND v_employee_id IS NOT NULL THEN
    UPDATE employees SET user_id = p_auth_user_id WHERE id = v_employee_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- DISPONIBILITÉS DE TEST
-- ===========================================

-- Semaine du 20 janvier 2025
INSERT INTO disponibilites (employee_id, semaine_debut, 
  lundi_disponible, lundi_debut, lundi_fin,
  mardi_disponible, mardi_debut, mardi_fin,
  mercredi_disponible, mercredi_debut, mercredi_fin,
  jeudi_disponible, jeudi_debut, jeudi_fin,
  vendredi_disponible, vendredi_debut, vendredi_fin,
  samedi_disponible, samedi_debut, samedi_fin
) VALUES
  -- Anas
  ((SELECT id FROM employees WHERE email = 'anas@email.com'), '2025-01-20',
   TRUE, '17:00', '20:30',
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, '14:00', '20:30',
   TRUE, '08:30', '14:00'),
  -- Celya
  ((SELECT id FROM employees WHERE email = 'celya@email.com'), '2025-01-20',
   TRUE, '17:00', '20:30',
   FALSE, NULL, NULL,
   TRUE, '14:00', '20:30',
   FALSE, NULL, NULL,
   TRUE, '17:00', '20:30',
   TRUE, '14:00', '19:30'),
  -- Nicolas
  ((SELECT id FROM employees WHERE email = 'nicolas@email.com'), '2025-01-20',
   TRUE, '14:00', '20:30',
   FALSE, NULL, NULL,
   TRUE, '17:00', '20:30',
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, '14:00', '19:30'),
  -- Maissa
  ((SELECT id FROM employees WHERE email = 'maissa@email.com'), '2025-01-20',
   TRUE, '17:00', '20:30',
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, '14:00', '20:30',
   TRUE, '17:00', '20:30',
   TRUE, '14:00', '19:30'),
  -- Robin
  ((SELECT id FROM employees WHERE email = 'robin@email.com'), '2025-01-20',
   TRUE, '08:30', '14:00',
   FALSE, NULL, NULL,
   TRUE, '08:30', '20:30',
   FALSE, NULL, NULL,
   FALSE, NULL, NULL,
   TRUE, '08:30', '14:00')
ON CONFLICT (employee_id, semaine_debut) DO NOTHING;

-- ===========================================
-- DEMANDES DE TEST
-- ===========================================

INSERT INTO demandes (employee_id, type, date_debut, date_fin, creneau, motif, status, urgent) VALUES
  ((SELECT id FROM employees WHERE prenom = 'Ludovic'), 'conge', '2025-01-24', '2025-01-24', 'journee', 'RDV médical important', 'en_attente', TRUE),
  ((SELECT id FROM employees WHERE prenom = 'Sarah'), 'echange', '2025-01-25', '2025-01-25', 'matin', 'Échange avec Laura - accord mutuel', 'en_attente', FALSE),
  ((SELECT id FROM employees WHERE prenom = 'Celya'), 'maladie', '2025-01-22', '2025-01-22', 'apres-midi', 'Grippe - arrêt médecin', 'en_attente', FALSE);

-- ===========================================
-- PLANNING DE TEST (Lundi 20 janvier)
-- ===========================================

INSERT INTO planning (employee_id, date, debut, fin, valide) VALUES
  -- Matin
  ((SELECT id FROM employees WHERE prenom = 'Lina'), '2025-01-20', '08:30', '14:00', FALSE),
  ((SELECT id FROM employees WHERE prenom = 'Maryam'), '2025-01-20', '08:30', '14:00', FALSE),
  ((SELECT id FROM employees WHERE prenom = 'Dilek'), '2025-01-20', '08:30', '14:00', FALSE),
  ((SELECT id FROM employees WHERE prenom = 'Manon'), '2025-01-20', '08:30', '12:00', FALSE),
  -- Après-midi
  ((SELECT id FROM employees WHERE prenom = 'Laura'), '2025-01-20', '14:00', '20:30', FALSE),
  ((SELECT id FROM employees WHERE prenom = 'Sarah'), '2025-01-20', '14:00', '20:30', FALSE),
  ((SELECT id FROM employees WHERE prenom = 'Hamide'), '2025-01-20', '14:00', '20:30', FALSE),
  ((SELECT id FROM employees WHERE prenom = 'Anas'), '2025-01-20', '17:00', '20:30', FALSE)
ON CONFLICT (employee_id, date) DO NOTHING;

SELECT 'Données de test créées avec succès !' as status;
