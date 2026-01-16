-- ===========================================
-- BAGGPLANNING - Script de création des tables
-- Exécuter dans Supabase SQL Editor
-- ===========================================

-- 1. Table des employés
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) DEFAULT '',
  email VARCHAR(255) UNIQUE NOT NULL,
  tel VARCHAR(20),
  role VARCHAR(20) NOT NULL CHECK (role IN ('Pharmacien', 'Preparateur', 'Apprenti', 'Etudiant')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des utilisateurs (extension de auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('titulaire', 'employe')),
  employee_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des disponibilités
CREATE TABLE IF NOT EXISTS disponibilites (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  semaine_debut DATE NOT NULL, -- Lundi de la semaine
  lundi_disponible BOOLEAN DEFAULT FALSE,
  lundi_debut TIME,
  lundi_fin TIME,
  mardi_disponible BOOLEAN DEFAULT FALSE,
  mardi_debut TIME,
  mardi_fin TIME,
  mercredi_disponible BOOLEAN DEFAULT FALSE,
  mercredi_debut TIME,
  mercredi_fin TIME,
  jeudi_disponible BOOLEAN DEFAULT FALSE,
  jeudi_debut TIME,
  jeudi_fin TIME,
  vendredi_disponible BOOLEAN DEFAULT FALSE,
  vendredi_debut TIME,
  vendredi_fin TIME,
  samedi_disponible BOOLEAN DEFAULT FALSE,
  samedi_debut TIME,
  samedi_fin TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, semaine_debut)
);

-- 4. Table du planning
CREATE TABLE IF NOT EXISTS planning (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  debut TIME NOT NULL,
  fin TIME NOT NULL,
  valide BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- 5. Table des demandes
CREATE TABLE IF NOT EXISTS demandes (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('conge', 'echange', 'maladie', 'autre')),
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  creneau VARCHAR(20) NOT NULL CHECK (creneau IN ('journee', 'matin', 'apres-midi')),
  motif TEXT,
  status VARCHAR(20) DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuve', 'refuse')),
  urgent BOOLEAN DEFAULT FALSE,
  remplacant_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEX pour optimiser les requêtes
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_employees_role ON employees(role);
CREATE INDEX IF NOT EXISTS idx_disponibilites_semaine ON disponibilites(semaine_debut);
CREATE INDEX IF NOT EXISTS idx_disponibilites_employee ON disponibilites(employee_id);
CREATE INDEX IF NOT EXISTS idx_planning_date ON planning(date);
CREATE INDEX IF NOT EXISTS idx_planning_employee ON planning(employee_id);
CREATE INDEX IF NOT EXISTS idx_demandes_status ON demandes(status);
CREATE INDEX IF NOT EXISTS idx_demandes_employee ON demandes(employee_id);

-- ===========================================
-- TRIGGERS pour updated_at automatique
-- ===========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disponibilites_updated_at
  BEFORE UPDATE ON disponibilites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_updated_at
  BEFORE UPDATE ON planning
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_demandes_updated_at
  BEFORE UPDATE ON demandes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- RLS (Row Level Security)
-- ===========================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE disponibilites ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning ENABLE ROW LEVEL SECURITY;
ALTER TABLE demandes ENABLE ROW LEVEL SECURITY;

-- Policies pour employees (tous peuvent lire, seul titulaire peut modifier)
CREATE POLICY "Tous peuvent voir les employés" ON employees FOR SELECT USING (true);
CREATE POLICY "Titulaire peut tout faire sur employees" ON employees FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'titulaire')
);

-- Policies pour disponibilites
CREATE POLICY "Tous peuvent voir les disponibilités" ON disponibilites FOR SELECT USING (true);
CREATE POLICY "Employé peut gérer ses propres disponibilités" ON disponibilites FOR ALL USING (
  employee_id IN (SELECT employee_id FROM users WHERE users.id = auth.uid())
);
CREATE POLICY "Titulaire peut tout faire sur disponibilités" ON disponibilites FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'titulaire')
);

-- Policies pour planning
CREATE POLICY "Tous peuvent voir le planning" ON planning FOR SELECT USING (true);
CREATE POLICY "Titulaire peut gérer le planning" ON planning FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'titulaire')
);

-- Policies pour demandes
CREATE POLICY "Employé peut voir ses propres demandes" ON demandes FOR SELECT USING (
  employee_id IN (SELECT employee_id FROM users WHERE users.id = auth.uid())
);
CREATE POLICY "Employé peut créer ses demandes" ON demandes FOR INSERT WITH CHECK (
  employee_id IN (SELECT employee_id FROM users WHERE users.id = auth.uid())
);
CREATE POLICY "Titulaire peut tout faire sur demandes" ON demandes FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'titulaire')
);

-- Policies pour users
CREATE POLICY "Utilisateur peut voir son profil" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Titulaire peut voir tous les users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.user_type = 'titulaire')
);

-- ===========================================
-- DONNÉES DE TEST
-- ===========================================

-- Insérer les employés de base
INSERT INTO employees (prenom, nom, email, tel, role) VALUES
  ('Lina', 'Martin', 'lina@pharmacie.fr', '06 11 22 33 44', 'Pharmacien'),
  ('Maryam', 'Benali', 'maryam@pharmacie.fr', '', 'Pharmacien'),
  ('Laura', 'Dubois', 'laura@pharmacie.fr', '', 'Pharmacien'),
  ('Sarah', 'Lambert', 'sarah@pharmacie.fr', '', 'Pharmacien'),
  ('Dilek', 'Yilmaz', 'dilek@pharmacie.fr', '', 'Preparateur'),
  ('Hamide', 'Kaya', 'hamide@pharmacie.fr', '', 'Preparateur'),
  ('Ludovic', 'Petit', 'ludovic@pharmacie.fr', '', 'Preparateur'),
  ('Manon', 'Roux', 'manon@pharmacie.fr', '', 'Apprenti'),
  ('Anas', '', 'anas@email.com', '06 12 34 56 78', 'Etudiant'),
  ('Celya', '', 'celya@email.com', '', 'Etudiant'),
  ('Nicolas', '', 'nicolas@email.com', '', 'Etudiant'),
  ('Maissa', '', 'maissa@email.com', '', 'Etudiant'),
  ('Robin', '', 'robin@email.com', '', 'Etudiant'),
  ('Jean-Baptiste', '', 'jb@email.com', '', 'Etudiant'),
  ('Matteo', '', 'matteo@email.com', '', 'Etudiant')
ON CONFLICT (email) DO NOTHING;

-- Note: Pour créer les utilisateurs avec authentification, utiliser le dashboard Supabase
-- ou l'API auth.signUp() depuis l'application

SELECT 'Tables créées avec succès !' as status;
