export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center text-2xl shadow-lg">
            📅
          </div>
          <div>
            <h1 className="text-2xl font-bold">BaggPlanning</h1>
            <p className="text-slate-300 text-sm">Gestion intelligente des plannings</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-4">
            Bienvenue sur BaggPlanning
          </h2>
          <p className="text-slate-600">
            Sélectionnez votre espace pour continuer
          </p>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Card Employé */}
          <a href="/employe" className="block bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-200">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-md">
              👤
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Espace Employé
            </h3>
            <p className="text-slate-600 mb-4">
              Saisissez vos disponibilités et gérez vos demandes de congés
            </p>
            <span className="text-orange-500 font-semibold flex items-center gap-2">
              Accéder →
            </span>
          </a>

          {/* Card Titulaire */}
          <a href="/titulaire" className="block bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 border border-slate-200">
            <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-md">
              👩‍💼
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Espace Titulaire
            </h3>
            <p className="text-slate-600 mb-4">
              Gérez les plannings, les demandes et visualisez les disponibilités
            </p>
            <span className="text-green-500 font-semibold flex items-center gap-2">
              Accéder →
            </span>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-slate-500 text-sm">
        BaggPlanning © 2025 - Développé par Anas
      </footer>
    </div>
  );
}