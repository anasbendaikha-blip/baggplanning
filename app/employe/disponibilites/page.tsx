'use client'

import { useEffect, useState } from 'react'

export default function EmployeDisponibilitesPage() {
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  })

  const jours = [
    { id: 'lundi', nom: 'Lundi', date: '20 janvier', shortDate: '20' },
    { id: 'mardi', nom: 'Mardi', date: '21 janvier', shortDate: '21' },
    { id: 'mercredi', nom: 'Mercredi', date: '22 janvier', shortDate: '22' },
    { id: 'jeudi', nom: 'Jeudi', date: '23 janvier', shortDate: '23' },
    { id: 'vendredi', nom: 'Vendredi', date: '24 janvier', shortDate: '24' },
    { id: 'samedi', nom: 'Samedi', date: '25 janvier', shortDate: '25' },
  ]

  const heuresDebut = ['08:30', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
  const heuresFin = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '19:30', '20:30']

  const [disponibilites, setDisponibilites] = useState<Record<string, { disponible: boolean; debut: string; fin: string }>>(() => {
    const init: Record<string, { disponible: boolean; debut: string; fin: string }> = {}
    jours.forEach((j) => {
      init[j.id] = { disponible: false, debut: '17:00', fin: '20:30' }
    })
    return init
  })

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type })
    window.setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3500)
  }

  const formatHeure = (h: string) => h.replace(':', 'h')

  const calculerHeures = () => {
    let total = 0
    Object.values(disponibilites).forEach((d) => {
      if (d.disponible) {
        const [hD, mD] = d.debut.split(':').map(Number)
        const [hF, mF] = d.fin.split(':').map(Number)
        total += hF + mF / 60 - (hD + mD / 60)
      }
    })
    return total.toFixed(1)
  }

  const toggleDispo = (jourId: string, value: boolean) => {
    setDisponibilites((prev) => ({
      ...prev,
      [jourId]: { ...prev[jourId], disponible: value },
    }))
  }

  const updateHeure = (jourId: string, type: 'debut' | 'fin', value: string) => {
    setDisponibilites((prev) => ({
      ...prev,
      [jourId]: { ...prev[jourId], [type]: value },
    }))
  }

  const quickSelect = (jourId: string, slot: string) => {
    const slots: Record<string, { debut: string; fin: string }> = {
      matin: { debut: '08:30', fin: '14:00' },
      aprem: { debut: '14:00', fin: '20:30' },
      soir: { debut: '17:00', fin: '20:30' },
      journee: { debut: '08:30', fin: '20:30' },
    }
    if (slots[slot]) {
      setDisponibilites((prev) => ({
        ...prev,
        [jourId]: { disponible: true, ...slots[slot] },
      }))
    }
  }

  const setAllAvailable = (value: boolean) => {
    setDisponibilites((prev) => {
      const newState = { ...prev }
      Object.keys(newState).forEach((key) => {
        newState[key] = { ...newState[key], disponible: value }
      })
      return newState
    })
  }

  const saveDisponibilites = () => {
    showToast('Disponibilités enregistrées avec succès !')
  }

  return (
    <>
      <div className="week-header">
        <div className="week-header-top">
          <div>
            <p className="week-label">Semaine</p>
            <p className="week-dates">20 - 25 Janvier 2025</p>
          </div>
          <div>
            <p className="week-hours-label">Total prévu</p>
            <p className="week-hours">{calculerHeures()}h</p>
          </div>
        </div>
        <div className="deadline-badge">
          ⏰ Date limite : <strong>Dimanche 19 janvier à 20h</strong>
        </div>
      </div>

      <div className="quick-actions">
        <button className="quick-action-btn primary" onClick={() => setAllAvailable(true)}>
          ✓ Tout disponible
        </button>
        <button className="quick-action-btn secondary" onClick={() => setAllAvailable(false)}>
          ✗ Tout effacer
        </button>
      </div>

      {jours.map((jour) => {
        const dispo = disponibilites[jour.id]
        return (
          <div key={jour.id} className={`day-card ${dispo.disponible ? 'available' : ''}`}>
            <div className="day-header">
              <div className="day-header-left">
                <div className="day-number">{jour.shortDate}</div>
                <div>
                  <div className="day-name">{jour.nom}</div>
                  <div className="day-date">{jour.date}</div>
                </div>
              </div>

              {dispo.disponible && (
                <div className="day-hours">
                  {formatHeure(dispo.debut)} - {formatHeure(dispo.fin)}
                </div>
              )}
            </div>

            <div className="day-content">
              <div className="toggle-btns">
                <button className={`toggle-btn ${dispo.disponible ? 'available' : ''}`} onClick={() => toggleDispo(jour.id, true)}>
                  ✓ Disponible
                </button>
                <button className={`toggle-btn ${!dispo.disponible ? 'unavailable' : ''}`} onClick={() => toggleDispo(jour.id, false)}>
                  ✗ Indisponible
                </button>
              </div>

              <div className={`time-selector ${dispo.disponible ? 'visible' : ''}`}>
                <div className="time-input">
                  <label>Début</label>
                  <select value={dispo.debut} onChange={(e) => updateHeure(jour.id, 'debut', e.target.value)}>
                    {heuresDebut.map((h) => (
                      <option key={h} value={h}>
                        {formatHeure(h)}
                      </option>
                    ))}
                  </select>
                </div>
                <span className="time-arrow">→</span>
                <div className="time-input">
                  <label>Fin</label>
                  <select value={dispo.fin} onChange={(e) => updateHeure(jour.id, 'fin', e.target.value)}>
                    {heuresFin.map((h) => (
                      <option key={h} value={h}>
                        {formatHeure(h)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={`quick-select ${dispo.disponible ? 'visible' : ''}`}>
                <button className="quick-btn" onClick={() => quickSelect(jour.id, 'matin')}>
                  🌅 Matin
                </button>
                <button className="quick-btn" onClick={() => quickSelect(jour.id, 'aprem')}>
                  🌆 Après-midi
                </button>
                <button className="quick-btn" onClick={() => quickSelect(jour.id, 'soir')}>
                  🌙 Soir
                </button>
                <button className="quick-btn" onClick={() => quickSelect(jour.id, 'journee')}>
                  ☀️ Journée
                </button>
              </div>
            </div>
          </div>
        )
      })}

      <button className="submit-btn" onClick={saveDisponibilites}>
        ✓ Enregistrer mes disponibilités
      </button>

      <div className={`toast ${toast.type} ${toast.visible ? 'active' : ''}`}>
        <span>{toast.type === 'success' ? '✓' : '✗'}</span>
        <span>{toast.message}</span>
      </div>
    </>
  )
}