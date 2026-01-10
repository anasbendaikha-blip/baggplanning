"use client";
import { useState } from "react";

export default function EmployePage() {
  const [selectedWeek, setSelectedWeek] = useState("2025-01-20");
  
  const jours = [
    { nom: "Lundi", date: "20 jan" },
    { nom: "Mardi", date: "21 jan" },
    { nom: "Mercredi", date: "22 jan" },
    { nom: "Jeudi", date: "23 jan" },
    { nom: "Vendredi", date: "24 jan" },
    { nom: "Samedi", date: "25 jan" },
  ];

  const [disponibilites, setDisponibilites] = useState(
    jours.map(() => ({ disponible: false, debut: "08:30", fin: "20:30" }))
  );

  const toggleDispo = (index: number) => {
    const newDispos = [...disponibilites];
    newDispos[index].disponible = !newDispos[index].disponible;
    setDisponibilites(newDispos);
  };

  const updateHeure = (index: number, type: "debut" | "fin", value: string) => {
    const newDispos = [...disponibilites];
    newDispos[index][type] = value;
    setDisponibilites(newDispos);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <a href="/" className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center text-xl shadow-lg">
            📅
          </a>
          <div>
            <h1 className="text-xl font-bold">BaggPlanning</h1>
            <p className="text-slate-300 text-sm">Espace Employé</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        {/* Titre */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Mes disponibilités
          </h2>
          <p className="text-slate-600">
            Semaine du 20 au 25 janvier 2025
          </p>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-semibold text-blue-800">Comment ça marche ?</p>
            <p className="text-blue-700 text-sm">
              Activez les jours où vous êtes disponible et indiquez vos horaires.
            </p>
          </div>
        </div>

        {/* Liste des jours */}
        <div className="space-y-3">
          {jours.map((jour, index) => (
            <div
              key={jour.nom}
              className={`bg-white rounded-xl p-4 border-2 transition-all ${
                disponibilites[index].disponible
                  ? "border-green-400 shadow-md"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Jour */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleDispo(index)}
                    className={`w-12 h-7 rounded-full transition-all ${
                      disponibilites[index].disponible
                        ? "bg-green-500"
                        : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow transition-all ${
                        disponibilites[index].disponible
                          ? "translate-x-6"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                  <div>
                    <p className="font-semibold text-slate-800">{jour.nom}</p>
                    <p className="text-sm text-slate-500">{jour.date}</p>
                  </div>
                </div>

                {/* Horaires */}
                {disponibilites[index].disponible && (
                  <div className="flex items-center gap-2">
                    <select
                      value={disponibilites[index].debut}
                      onChange={(e) => updateHeure(index, "debut", e.target.value)}
                      className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="08:30">8h30</option>
                      <option value="09:00">9h00</option>
                      <option value="10:00">10h00</option>
                      <option value="11:00">11h00</option>
                      <option value="12:00">12h00</option>
                      <option value="13:00">13h00</option>
                      <option value="14:00">14h00</option>
                      <option value="17:00">17h00</option>
                    </select>
                    <span className="text-slate-400">à</span>
                    <select
                      value={disponibilites[index].fin}
                      onChange={(e) => updateHeure(index, "fin", e.target.value)}
                      className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="12:00">12h00</option>
                      <option value="13:00">13h00</option>
                      <option value="14:00">14h00</option>
                      <option value="17:00">17h00</option>
                      <option value="18:00">18h00</option>
                      <option value="19:00">19h00</option>
                      <option value="19:30">19h30</option>
                      <option value="20:30">20h30</option>
                    </select>
                  </div>
                )}

                {!disponibilites[index].disponible && (
                  <span className="text-slate-400 text-sm">Non disponible</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bouton Enregistrer */}
        <button
          onClick={() => alert("Disponibilités enregistrées !")}
          className="w-full mt-6 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
        >
          Enregistrer mes disponibilités
        </button>

        {/* Lien retour */}
        <a
          href="/"
          className="block text-center mt-4 text-slate-500 hover:text-slate-700"
        >
          Retour à accueil
        </a>
      </main>
    </div>
  );
}