'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  MOCK_DEMANDES,
  getColorFromInitials,
  getUniqueFonctions,
  getUniqueEmployes,
  type Demande,
  type FonctionEmploye,
} from '@/lib/demandes/mock-data';
import {
  getDaysInMonthGrid,
  getMonthName,
  getWeekDayNames,
  isInRange,
  formatPeriod,
  countDaysBetween,
  formatDateFull,
} from '@/lib/demandes/calendar-utils';

export default function CongesPage() {
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [filtreFunction, setFiltreFunction] = useState<FonctionEmploye | 'all'>('all');
  const [filtreEmploye, setFiltreEmploye] = useState<string>('all');
  const [inclureEnAttente, setInclureEnAttente] = useState(true);

  // Filtrer uniquement les congés
  const congesOnly = useMemo(() => {
    return MOCK_DEMANDES.filter(d => d.type === 'conge');
  }, []);

  // Listes pour les filtres
  const fonctions = useMemo(() => getUniqueFonctions(congesOnly), [congesOnly]);
  const employes = useMemo(() => getUniqueEmployes(congesOnly), [congesOnly]);

  // Congés filtrés
  const congesFiltered = useMemo(() => {
    let result = congesOnly;

    // Filtrer par année (congé qui touche l'année sélectionnée)
    result = result.filter(d => {
      const startYear = d.dateDebut.getFullYear();
      const endYear = d.dateFin.getFullYear();
      return startYear === selectedYear || endYear === selectedYear;
    });

    // Filtrer par status
    if (!inclureEnAttente) {
      result = result.filter(d => d.status === 'approuvee');
    }

    // Filtrer par fonction
    if (filtreFunction !== 'all') {
      result = result.filter(d => d.fonction === filtreFunction);
    }

    // Filtrer par employé
    if (filtreEmploye !== 'all') {
      result = result.filter(d => d.employeId === filtreEmploye);
    }

    return result;
  }, [congesOnly, selectedYear, inclureEnAttente, filtreFunction, filtreEmploye]);

  // Congés pour le jour sélectionné
  const congesSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return congesFiltered.filter(d => isInRange(selectedDay, d.dateDebut, d.dateFin));
  }, [selectedDay, congesFiltered]);

  // Obtenir les congés pour un jour donné
  const getCongesForDay = (date: Date): Demande[] => {
    return congesFiltered.filter(d => isInRange(date, d.dateDebut, d.dateFin));
  };

  const weekDays = getWeekDayNames();

  return (
    <div className="conges-container">
      {/* Header */}
      <header className="header">
        <Link href="/titulaire/demandes" className="back-link">
          ← Demandes
        </Link>
        <h1 className="title">📅 Congés annuels</h1>
        <div className="year-selector">
          <button
            className="year-btn"
            onClick={() => setSelectedYear(y => y - 1)}
            aria-label="Année précédente"
          >
            ←
          </button>
          <span className="year-value">{selectedYear}</span>
          <button
            className="year-btn"
            onClick={() => setSelectedYear(y => y + 1)}
            aria-label="Année suivante"
          >
            →
          </button>
        </div>
      </header>

      {/* Filtres */}
      <div className="filters-bar">
        <div className="filter-group">
          <label htmlFor="filter-fonction">Fonction</label>
          <select
            id="filter-fonction"
            value={filtreFunction}
            onChange={e => setFiltreFunction(e.target.value as FonctionEmploye | 'all')}
          >
            <option value="all">Toutes</option>
            {fonctions.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="filter-employe">Employé</label>
          <select
            id="filter-employe"
            value={filtreEmploye}
            onChange={e => setFiltreEmploye(e.target.value)}
          >
            <option value="all">Tous</option>
            {employes.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group filter-checkbox">
          <label>
            <input
              type="checkbox"
              checked={inclureEnAttente}
              onChange={e => setInclureEnAttente(e.target.checked)}
            />
            Inclure demandes en attente
          </label>
        </div>
      </div>

      {/* Légende */}
      <div className="legend-bar">
        <div className="legend-item">
          <span className="legend-dot approved"></span>
          <span>Approuvé</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot pending"></span>
          <span>En attente</span>
        </div>
        <div className="legend-counter">
          {congesFiltered.length} congé{congesFiltered.length > 1 ? 's' : ''} affiché{congesFiltered.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Calendrier 12 mois */}
      <div className="calendar-grid">
        {Array.from({ length: 12 }, (_, month) => (
          <div key={month} className="month-card">
            <h3 className="month-name">{getMonthName(month)}</h3>
            <div className="weekdays-row">
              {weekDays.map((day, i) => (
                <span key={i} className="weekday">{day}</span>
              ))}
            </div>
            <div className="days-grid">
              {getDaysInMonthGrid(selectedYear, month).map((calDay, i) => {
                const dayConges = calDay.isCurrentMonth ? getCongesForDay(calDay.date) : [];
                const hasConges = dayConges.length > 0;
                const isDisabled = !calDay.isCurrentMonth;

                return (
                  <button
                    key={i}
                    className={`day-cell ${isDisabled ? 'disabled' : ''} ${hasConges ? 'has-conges' : ''}`}
                    disabled={isDisabled}
                    onClick={() => hasConges && setSelectedDay(calDay.date)}
                    aria-label={hasConges ? `${calDay.dayNumber} - ${dayConges.length} congés` : String(calDay.dayNumber)}
                  >
                    <span className="day-number">{calDay.dayNumber}</span>
                    {hasConges && (
                      <div className="dots-container">
                        {dayConges.slice(0, 3).map((conge, idx) => (
                          <span
                            key={idx}
                            className={`dot ${conge.status === 'en_attente' ? 'pending' : 'approved'}`}
                            style={{ backgroundColor: getColorFromInitials(conge.initials) }}
                          />
                        ))}
                        {dayConges.length > 3 && (
                          <span className="dot-more">+{dayConges.length - 3}</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Panneau latéral */}
      {selectedDay && (
        <>
          <div className="overlay" onClick={() => setSelectedDay(null)} />
          <div className="side-panel">
            <div className="panel-header">
              <h2>Congés le {formatDateFull(selectedDay)}</h2>
              <button className="close-btn" onClick={() => setSelectedDay(null)} aria-label="Fermer">
                ✕
              </button>
            </div>
            <div className="panel-content">
              {congesSelectedDay.length === 0 ? (
                <p className="empty-state">Aucun congé ce jour-là</p>
              ) : (
                <ul className="conges-list">
                  {congesSelectedDay.map(conge => (
                    <li key={conge.id} className="conge-item">
                      <div
                        className="avatar"
                        style={{ backgroundColor: getColorFromInitials(conge.initials) }}
                      >
                        {conge.initials}
                      </div>
                      <div className="conge-details">
                        <div className="conge-header">
                          <span className="employe-name">{conge.employeeName}</span>
                          <span className={`status-badge ${conge.status}`}>
                            {conge.status === 'approuvee' ? '✓ Approuvé' : '⏳ En attente'}
                          </span>
                        </div>
                        <div className="conge-fonction">{conge.fonction}</div>
                        <div className="conge-period">
                          {formatPeriod(conge.dateDebut, conge.dateFin)} ({countDaysBetween(conge.dateDebut, conge.dateFin)} jours)
                        </div>
                        {conge.motif && (
                          <div className="conge-motif">{conge.motif}</div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .conges-container {
          padding: 1.5rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* Header */
        .header {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .back-link {
          color: var(--primary);
          text-decoration: none;
          font-weight: 500;
          transition: opacity 0.2s;
        }

        .back-link:hover {
          opacity: 0.8;
        }

        .title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          flex: 1;
        }

        .year-selector {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
        }

        .year-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--primary);
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .year-btn:hover {
          background-color: var(--bg);
        }

        .year-value {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text);
          min-width: 4rem;
          text-align: center;
        }

        /* Filtres */
        .filters-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .filter-group label {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filter-group select {
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          background: var(--bg);
          color: var(--text);
          font-size: 0.875rem;
          min-width: 150px;
          cursor: pointer;
        }

        .filter-group select:focus {
          outline: none;
          border-color: var(--primary);
        }

        .filter-checkbox {
          justify-content: flex-end;
        }

        .filter-checkbox label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--text);
          text-transform: none;
          letter-spacing: normal;
        }

        .filter-checkbox input[type="checkbox"] {
          width: 1rem;
          height: 1rem;
          cursor: pointer;
          accent-color: var(--primary);
        }

        /* Légende */
        .legend-bar {
          display: flex;
          gap: 1.5rem;
          align-items: center;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--text);
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }

        .legend-dot.approved {
          background: var(--success);
        }

        .legend-dot.pending {
          background: var(--warning);
          opacity: 0.5;
          border: 2px dashed var(--warning);
        }

        .legend-counter {
          margin-left: auto;
          font-size: 0.875rem;
          color: var(--muted);
          font-weight: 500;
        }

        /* Calendrier */
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        @media (max-width: 1024px) {
          .calendar-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .calendar-grid {
            grid-template-columns: 1fr;
          }
        }

        .month-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
        }

        .month-name {
          text-align: center;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text);
          margin: 0 0 0.75rem 0;
        }

        .weekdays-row {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
          margin-bottom: 0.5rem;
        }

        .weekday {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--muted);
          padding: 0.25rem 0;
        }

        .days-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 2px;
        }

        .day-cell {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid transparent;
          border-radius: 6px;
          background: var(--bg);
          cursor: default;
          padding: 2px;
          transition: all 0.2s;
          position: relative;
        }

        .day-cell.disabled {
          opacity: 0.3;
        }

        .day-cell.has-conges {
          cursor: pointer;
        }

        .day-cell.has-conges:hover {
          border-color: var(--primary);
          transform: scale(1.05);
        }

        .day-number {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--text);
        }

        .dots-container {
          display: flex;
          gap: 2px;
          margin-top: 2px;
          flex-wrap: wrap;
          justify-content: center;
          max-width: 100%;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .dot.pending {
          opacity: 0.5;
          border: 1px dashed currentColor;
        }

        .dot-more {
          font-size: 0.6rem;
          color: var(--muted);
          font-weight: 600;
        }

        /* Overlay */
        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 100;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* Side Panel */
        .side-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 400px;
          max-width: 90vw;
          height: 100vh;
          background: var(--card);
          box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
          z-index: 101;
          display: flex;
          flex-direction: column;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .panel-header h2 {
          font-size: 1.125rem;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.25rem;
          cursor: pointer;
          color: var(--muted);
          padding: 0.5rem;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: var(--bg);
          color: var(--text);
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 1.5rem;
        }

        .empty-state {
          text-align: center;
          color: var(--muted);
          padding: 2rem;
        }

        .conges-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .conge-item {
          display: flex;
          gap: 1rem;
          padding: 1rem;
          background: var(--bg);
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 0.875rem;
          flex-shrink: 0;
        }

        .conge-details {
          flex: 1;
          min-width: 0;
        }

        .conge-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }

        .employe-name {
          font-weight: 600;
          color: var(--text);
        }

        .status-badge {
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 999px;
          font-weight: 500;
        }

        .status-badge.approuvee {
          background: rgba(16, 185, 129, 0.1);
          color: var(--success);
        }

        .status-badge.en_attente {
          background: rgba(245, 158, 11, 0.1);
          color: var(--warning);
        }

        .conge-fonction {
          font-size: 0.875rem;
          color: var(--muted);
          margin-bottom: 0.25rem;
        }

        .conge-period {
          font-size: 0.875rem;
          color: var(--text);
          margin-bottom: 0.25rem;
        }

        .conge-motif {
          font-size: 0.813rem;
          color: var(--muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
