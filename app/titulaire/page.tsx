"use client";
import { useState } from "react";

export default function TitulairePage() {
  const [onglet, setOnglet] = useState("dispos");

  const etudiants = [
    { nom: "Celya", initiales: "CE" },
    { nom: "Anas", initiales: "AN" },
    { nom: "Nicolas", initiales: "NI" },
    { nom: "Maissa", initiales: "MA" },
    { nom: "Robin", initiales: "RO" },
  ];

  const jours = ["Lun 20", "Mar 21", "Mer 22", "Jeu 23", "Ven 24", "Sam 25"];

  const dispos = [
    ["17h-20h30", "-", "14h-20h30", "-", "17h-20h30", "14h-19h30"],
    ["17h-20h30", "17h-20h30", "-", "-", "14h-20h30", "8h30-14h"],
    ["14h-20h30", "-", "17h-20h30", "-", "-", "14h-19h30"],
    ["17h-20h30", "-", "-", "14h-20h30", "17h-20h30", "14h-19h30"],
    ["8h30-14h", "-", "8h30-20h30", "-", "-", "8h30-14h"],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800 to-slate-700 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-500 rounded-xl flex items-center justify-center text-xl shadow-lg">
              📅
            </a>
            <div>
              <h1 className="text-xl font-bold">BaggPlanning</h1>
              <p className="text-slate-300 text-sm">Espace Titulaire</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-300">Semaine du</p>
            <p className="font-semibold">20 - 25 Janvier 2025</p>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto flex gap-2 p-2">
          <button
            onClick={() => setOnglet("dispos")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              onglet === "dispos"
                ? "bg-green-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Disponibilites
          </button>
          <button
            onClick={() => setOnglet("demandes")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              onglet === "demandes"
                ? "bg-green-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Demandes
          </button>
          <button
            onClick={() => setOnglet("planning")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              onglet === "planning"
                ? "bg-green-500 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Planning
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        
        {/* ONGLET DISPONIBILITES */}
        {onglet === "dispos" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Disponibilites recues</h2>
                <p className="text-slate-600">5 etudiants ont repondu</p>
              </div>
              <button className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600">
                Envoyer rappel
              </button>
            </div>

            {/* Tableau */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-4 font-semibold text-slate-700">Etudiant</th>
                    {jours.map((jour) => (
                      <th key={jour} className="p-4 font-semibold text-slate-700 text-center">
                        {jour}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {etudiants.map((etudiant, i) => (
                    <tr key={etudiant.nom} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {etudiant.initiales}
                          </div>
                          <span className="font-medium text-slate-800">{etudiant.nom}</span>
                        </div>
                      </td>
                      {dispos[i].map((dispo, j) => (
                        <td key={j} className="p-4 text-center">
                          {dispo === "-" ? (
                            <span className="text-slate-300">-</span>
                          ) : (
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-sm font-medium">
                              {dispo}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ONGLET DEMANDES */}
        {onglet === "demandes" && (
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Demandes a traiter</h2>
            
            {/* Demande 1 */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-4 border-l-4 border-yellow-400">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    LU
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Ludovic</h3>
                    <p className="text-slate-500 text-sm">Preparateur</p>
                    <div className="mt-2">
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm font-medium">
                        Conge
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">Vendredi 24 janvier</p>
                  <p className="text-slate-500 text-sm">Journee entiere</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-600 text-sm italic">"RDV medical important"</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600">
                  Trouver remplacant
                </button>
                <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">
                  Refuser
                </button>
              </div>
            </div>

            {/* Demande 2 */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-400">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                    CE
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Celya</h3>
                    <p className="text-slate-500 text-sm">Etudiant</p>
                    <div className="mt-2">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm font-medium">
                        Echange
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-800">Mercredi 22 janvier</p>
                  <p className="text-slate-500 text-sm">Apres-midi</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-slate-600 text-sm italic">"Echange avec Nicolas"</p>
              </div>
              <div className="mt-4 flex gap-3">
                <button className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600">
                  Approuver
                </button>
                <button className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-300">
                  Refuser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET PLANNING */}
        {onglet === "planning" && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Planning de la semaine</h2>
              <button className="bg-green-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-600">
                Valider et publier
              </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6">
              <p className="text-slate-600 text-center py-12">
                Le planning timeline sera affiche ici
              </p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}