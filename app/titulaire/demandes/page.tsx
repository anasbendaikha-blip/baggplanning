'use client'

import { useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import {
  MOCK_DEMANDES,
  MOCK_EMPLOYEES,
  type MockDemande,
  type EmployeeRole,
  getRoleLabel,
  getRoleIcon,
} from '@/lib/mock-data'
import { T, DEMANDE_TYPES, STATUS_COLORS, ROLE_PALETTE } from '@/lib/ui-tokens'

// ============================================================
// Helpers
// ============================================================

const TYPE_CFG = DEMANDE_TYPES
const STATUS_CFG = STATUS_COLORS

type FilterStatus = 'all' | 'pending' | 'urgent' | 'approved' | 'refused'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function getEmployeeRole(empId: string): EmployeeRole | null {
  const emp = MOCK_EMPLOYEES.find(e => e.id === empId)
  return emp?.fonction ?? null
}

function getRoleLabelFr(role: EmployeeRole): string {
  return getRoleLabel(role)
}

// ============================================================
// Page
// ============================================================

export default function DemandesPage() {
  const [demandes, setDemandes] = useState(MOCK_DEMANDES)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [toast, setToast] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false, message: '', type: 'success',
  })

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ visible: true, message, type })
    window.setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000)
  }, [])

  // KPI counts
  const pendingCount = useMemo(() => demandes.filter(d => d.status === 'pending').length, [demandes])
  const urgentCount = useMemo(() => demandes.filter(d => d.status === 'pending' && d.urgent).length, [demandes])
  const approvedCount = useMemo(() => demandes.filter(d => d.status === 'approved').length, [demandes])
  const refusedCount = useMemo(() => demandes.filter(d => d.status === 'refused').length, [demandes])

  // Filtered + sorted (always urgent first)
  const filtered = useMemo(() => {
    let list = [...demandes]

    if (filterStatus === 'pending') list = list.filter(d => d.status === 'pending')
    else if (filterStatus === 'approved') list = list.filter(d => d.status === 'approved')
    else if (filterStatus === 'refused') list = list.filter(d => d.status === 'refused')
    else if (filterStatus === 'urgent') list = list.filter(d => d.status === 'pending' && d.urgent)

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(d =>
        d.employee_name.toLowerCase().includes(q) ||
        d.motif.toLowerCase().includes(q) ||
        (TYPE_CFG[d.type]?.label || '').toLowerCase().includes(q)
      )
    }

    // Always urgent first, then recent
    list.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1
      if (!a.urgent && b.urgent) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return list
  }, [demandes, filterStatus, search])

  // Split into urgent vs normal for grouped display
  const urgentDemandes = useMemo(() => filtered.filter(d => d.urgent && d.status === 'pending'), [filtered])
  const normalDemandes = useMemo(() => filtered.filter(d => !(d.urgent && d.status === 'pending')), [filtered])

  // Actions
  const handleApprove = (id: string) => {
    setDemandes(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' as const } : d))
    setSelectedId(null)
    setComment('')
    showToast('Demande approuvée')
  }

  const handleRefuse = (id: string) => {
    setDemandes(prev => prev.map(d => d.id === id ? { ...d, status: 'refused' as const } : d))
    setSelectedId(null)
    setComment('')
    showToast('Demande refusée')
  }

  const selected = selectedId ? demandes.find(d => d.id === selectedId) ?? null : null

  return (
    <>
      <div className="rq-page">
        {/* ======== TOP BAR ======== */}
        <div className="rq-topbar">
          {/* Left: Title + inline stats */}
          <div className="rq-title-section">
            <h1 className="rq-title">Demandes</h1>
            <div className="rq-stats-inline">
              <span className="rq-stat">
                <strong>{pendingCount}</strong> à traiter
              </span>
              {urgentCount > 0 && (
                <span className="rq-stat urgent">
                  • <strong>{urgentCount}</strong> urgente{urgentCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Right: Congés link + search toggle */}
          <div className="rq-topbar-right">
            <Link href="/titulaire/demandes/conges" className="rq-conges-link">
              📅 Congés annuels
            </Link>
            <button
              className={`rq-search-toggle ${searchOpen ? 'active' : ''}`}
              onClick={() => setSearchOpen(p => !p)}
              title="Rechercher"
            >
              🔍
            </button>
          </div>
        </div>

        {/* ======== SEARCH (collapsible) ======== */}
        {searchOpen && (
          <div className="rq-search-bar">
            <span className="rq-search-icon">🔍</span>
            <input
              className="rq-search-input"
              type="text"
              placeholder="Rechercher un nom, motif…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button className="rq-search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>
        )}

        {/* ======== FILTER TABS ======== */}
        <div className="rq-filters">
          <div className="rq-filter-tabs">
            {([
              ['all', `Toutes`, demandes.length],
              ['pending', `En attente`, pendingCount],
              ['urgent', `⚠️ Urgentes`, urgentCount],
              ['approved', `✓ Approuvées`, approvedCount],
              ['refused', `✗ Refusées`, refusedCount],
            ] as [FilterStatus, string, number][]).map(([key, label, count]) => (
              <button
                key={key}
                className={`rq-filter ${filterStatus === key ? 'active' : ''} ${key === 'urgent' && filterStatus === key ? 'urgent-active' : ''}`}
                onClick={() => setFilterStatus(key)}
              >
                {label} <span className="rq-filter-count">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ======== CONTENT ======== */}
        <div className="rq-content">
          {filtered.length === 0 ? (
            <div className="rq-empty">
              <span className="rq-empty-icon">📋</span>
              <p>Aucune demande pour ces filtres</p>
              <button className="rq-empty-btn" onClick={() => { setFilterStatus('all'); setSearch('') }}>
                Réinitialiser
              </button>
            </div>
          ) : (
            <>
              {/* Urgent section */}
              {urgentDemandes.length > 0 && filterStatus !== 'approved' && filterStatus !== 'refused' && (
                <div className="rq-section">
                  <div className="rq-section-header urgent">
                    <span>⚠️</span>
                    <span className="rq-section-title">URGENTES</span>
                    <span className="rq-section-sub">À traiter en priorité</span>
                  </div>
                  <div className="rq-cards">
                    {urgentDemandes.map(d => (
                      <RequestCard
                        key={d.id}
                        demande={d}
                        isUrgent
                        onApprove={handleApprove}
                        onRefuse={handleRefuse}
                        onSelect={setSelectedId}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Normal section */}
              {normalDemandes.length > 0 && (
                <div className="rq-section">
                  {urgentDemandes.length > 0 && filterStatus !== 'approved' && filterStatus !== 'refused' && (
                    <div className="rq-section-header normal">
                      <span>📋</span>
                      <span className="rq-section-title">AUTRES DEMANDES</span>
                    </div>
                  )}
                  <div className="rq-cards">
                    {normalDemandes.map(d => (
                      <RequestCard
                        key={d.id}
                        demande={d}
                        isUrgent={false}
                        onApprove={handleApprove}
                        onRefuse={handleRefuse}
                        onSelect={setSelectedId}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ======== DRAWER / MODAL ======== */}
      {selected && (
        <div className="rq-overlay" onClick={() => { setSelectedId(null); setComment('') }}>
          <div className="rq-drawer" onClick={e => e.stopPropagation()}>
            <div className="rq-drawer-head">
              <h2 className="rq-drawer-title">Détail de la demande</h2>
              <button className="rq-drawer-close" onClick={() => { setSelectedId(null); setComment('') }}>✕</button>
            </div>

            {(() => {
              const tc = TYPE_CFG[selected.type] || TYPE_CFG.conge
              const sc = STATUS_CFG[selected.status] || STATUS_CFG.pending
              const isPending = selected.status === 'pending'
              const role = getEmployeeRole(selected.employee_id)

              return (
                <div className="rq-drawer-body">
                  {selected.urgent && isPending && (
                    <div className="rq-drawer-urgent">⚠️ Demande urgente — traitement prioritaire</div>
                  )}

                  <div className="rq-drawer-emp">
                    <div className="rq-drawer-avatar" style={{ background: role ? ROLE_PALETTE[role].bg : tc.color, color: 'white' }}>
                      {selected.employee_initiales}
                    </div>
                    <div>
                      <span className="rq-drawer-name">{selected.employee_name}</span>
                      {role && <span className="rq-drawer-role">{getRoleLabelFr(role)}</span>}
                    </div>
                  </div>

                  <div className="rq-drawer-badges">
                    <span className="rq-badge lg" style={{ background: tc.color + '18', color: tc.color }}>
                      {tc.icon} {tc.label}
                    </span>
                    <span className="rq-badge lg" style={{ background: sc.bg, color: sc.color }}>
                      {sc.label}
                    </span>
                  </div>

                  <div className="rq-drawer-grid">
                    <div className="rq-drawer-field">
                      <span className="rq-drawer-label">Date</span>
                      <span className="rq-drawer-value">{formatDate(selected.date)}</span>
                    </div>
                    <div className="rq-drawer-field">
                      <span className="rq-drawer-label">Créneau</span>
                      <span className="rq-drawer-value">{selected.creneau}</span>
                    </div>
                    <div className="rq-drawer-field">
                      <span className="rq-drawer-label">Demandé le</span>
                      <span className="rq-drawer-value">{formatDate(selected.created_at)}</span>
                    </div>
                  </div>

                  {selected.motif && (
                    <div className="rq-drawer-motif">
                      <span className="rq-drawer-label">Motif</span>
                      <p className="rq-drawer-motif-text">{selected.motif}</p>
                    </div>
                  )}

                  {isPending && (
                    <div className="rq-drawer-comment">
                      <label className="rq-drawer-label">Commentaire (optionnel)</label>
                      <textarea
                        className="rq-textarea"
                        rows={2}
                        placeholder="Ajouter un commentaire…"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                      />
                    </div>
                  )}

                  {isPending && (
                    <div className="rq-drawer-actions">
                      <button className="rq-action-btn approve full" onClick={() => handleApprove(selected.id)}>
                        ✓ Approuver
                      </button>
                      <button className="rq-action-btn refuse full" onClick={() => handleRefuse(selected.id)}>
                        ✕ Refuser
                      </button>
                    </div>
                  )}

                  {!isPending && (
                    <div className="rq-drawer-resolved">
                      <span>{selected.status === 'approved' ? '✅' : '❌'}</span>
                      <span>Demande {selected.status === 'approved' ? 'approuvée' : 'refusée'}</span>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ======== TOAST ======== */}
      <div className={`rq-toast ${toast.type} ${toast.visible ? 'show' : ''}`}>
        <span>{toast.type === 'success' ? '✓' : '✗'}</span>
        <span>{toast.message}</span>
      </div>

      {/* ======== STYLES ======== */}
      <style jsx global>{`
        /* ============ Page ============ */
        .rq-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 72px);
          background: ${T.bg};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
        }

        /* ============ Top Bar ============ */
        .rq-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
        }
        .rq-title-section {
          display: flex;
          align-items: baseline;
          gap: 14px;
        }
        .rq-title {
          font-size: 20px;
          font-weight: 800;
          color: ${T.text};
          margin: 0;
        }
        .rq-stats-inline {
          display: flex;
          gap: 6px;
          font-size: 13px;
          color: ${T.textSec};
        }
        .rq-stat strong {
          font-weight: 700;
          color: ${T.text};
        }
        .rq-stat.urgent {
          color: ${T.dangerDk};
        }
        .rq-stat.urgent strong {
          color: ${T.danger};
        }
        .rq-topbar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .rq-conges-link {
          padding: 5px 12px;
          background: ${T.primaryBg};
          border: 1px solid ${T.primaryLt};
          border-radius: 7px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.primaryDk};
          text-decoration: none;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .rq-conges-link:hover {
          background: ${T.primaryLt};
        }
        .rq-search-toggle {
          width: 32px;
          height: 32px;
          border: 1px solid ${T.border};
          border-radius: 7px;
          background: ${T.card};
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .rq-search-toggle:hover { background: ${T.bg}; }
        .rq-search-toggle.active {
          background: ${T.infoLt};
          border-color: ${T.info};
        }

        /* ============ Search Bar ============ */
        .rq-search-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
        }
        .rq-search-icon { font-size: 13px; flex-shrink: 0; }
        .rq-search-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 6px 0;
          font-size: 13px;
          color: ${T.text};
          background: transparent;
        }
        .rq-search-input::placeholder { color: ${T.muted}; }
        .rq-search-clear {
          background: ${T.borderLt};
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          font-size: 10px;
          cursor: pointer;
          color: ${T.textSec};
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ============ Filter Tabs ============ */
        .rq-filters {
          padding: 8px 20px;
          background: ${T.card};
          border-bottom: 1px solid ${T.border};
        }
        .rq-filter-tabs {
          display: flex;
          gap: 2px;
          background: ${T.borderLt};
          border-radius: 8px;
          padding: 2px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .rq-filter-tabs::-webkit-scrollbar { display: none; }
        .rq-filter {
          padding: 5px 12px;
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          color: ${T.textSec};
          background: transparent;
          cursor: pointer;
          transition: all 0.15s;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .rq-filter:hover { color: ${T.text}; }
        .rq-filter.active {
          background: ${T.card};
          color: ${T.info};
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        }
        .rq-filter.urgent-active {
          color: ${T.danger};
        }
        .rq-filter-count {
          font-size: 10px;
          opacity: 0.6;
          margin-left: 2px;
        }

        /* ============ Content ============ */
        .rq-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px 16px;
        }

        /* Section headers */
        .rq-section {
          margin-bottom: 12px;
        }
        .rq-section-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 7px;
          margin-bottom: 8px;
          font-size: 12px;
        }
        .rq-section-header.urgent {
          background: #fef2f2;
          border-left: 3px solid ${T.danger};
        }
        .rq-section-header.normal {
          background: ${T.borderLt};
          border-left: 3px solid ${T.border};
        }
        .rq-section-title {
          font-weight: 700;
          letter-spacing: 0.04em;
          color: ${T.text};
        }
        .rq-section-header.urgent .rq-section-title {
          color: ${T.dangerDk};
        }
        .rq-section-sub {
          font-size: 11px;
          color: ${T.dangerDk};
          margin-left: auto;
          font-weight: 500;
        }

        /* Cards list */
        .rq-cards {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        /* ============ Request Card ============ */
        .rq-card {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: ${T.card};
          border: 1px solid ${T.border};
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.12s;
        }
        .rq-card:hover {
          border-color: ${T.borderMd};
          box-shadow: 0 2px 6px rgba(0,0,0,0.05);
        }
        .rq-card.urgent {
          background: #fef2f2;
          border-color: #fca5a5;
          border-width: 1.5px;
        }
        .rq-card.approved {
          opacity: 0.7;
        }
        .rq-card.refused {
          opacity: 0.6;
        }

        /* Card avatar */
        .rq-card-avatar {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 11px;
          color: white;
          flex-shrink: 0;
        }

        /* Card info */
        .rq-card-info {
          flex: 1;
          min-width: 0;
        }
        .rq-card-top {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 2px;
        }
        .rq-card-name {
          font-size: 13px;
          font-weight: 700;
          color: ${T.text};
        }
        .rq-card-role {
          font-size: 11px;
          color: ${T.textSec};
          font-weight: 500;
        }
        .rq-card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: ${T.textSec};
        }
        .rq-card-type {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-weight: 600;
        }
        .rq-card-sep {
          color: ${T.borderMd};
          font-size: 10px;
        }
        .rq-card-motif {
          font-size: 11px;
          color: ${T.muted};
          margin-top: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Card status badge */
        .rq-card-status {
          padding: 3px 8px;
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Card actions */
        .rq-card-actions {
          display: flex;
          gap: 4px;
          flex-shrink: 0;
        }
        .rq-action-btn {
          border: none;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .rq-action-btn.sm {
          width: 32px;
          height: 32px;
        }
        .rq-action-btn.approve {
          background: ${T.primaryLt};
          color: ${T.primaryDk};
        }
        .rq-action-btn.approve:hover {
          background: ${T.primary};
          color: white;
        }
        .rq-action-btn.refuse {
          background: ${T.dangerLt};
          color: ${T.dangerDk};
        }
        .rq-action-btn.refuse:hover {
          background: ${T.danger};
          color: white;
        }
        .rq-action-btn.full {
          padding: 10px 16px;
          font-size: 13px;
          gap: 6px;
          flex: 1;
          min-height: 40px;
        }

        /* ============ Empty ============ */
        .rq-empty {
          text-align: center;
          padding: 40px 20px;
          color: ${T.muted};
          font-size: 13px;
        }
        .rq-empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }
        .rq-empty p { margin: 0 0 12px; }
        .rq-empty-btn {
          padding: 8px 16px;
          background: ${T.primaryLt};
          color: ${T.primaryDk};
          border: none;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        /* ============ Drawer ============ */
        .rq-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,.4);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          animation: rq-fadeIn .15s ease;
        }
        @keyframes rq-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .rq-drawer {
          background: ${T.card};
          border-radius: ${T.radius} ${T.radius} 0 0;
          width: 100%;
          max-width: 520px;
          max-height: 85vh;
          overflow-y: auto;
          animation: rq-slideUp .2s ease;
          box-shadow: ${T.shadowLg};
        }
        @media (min-width: 768px) {
          .rq-drawer {
            border-radius: ${T.radius};
            margin: auto;
            max-height: 80vh;
          }
        }
        @keyframes rq-slideUp {
          from { transform: translateY(30px); opacity: .8; }
          to { transform: translateY(0); opacity: 1; }
        }
        .rq-drawer-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-bottom: 1px solid ${T.border};
          position: sticky;
          top: 0;
          background: ${T.card};
          z-index: 1;
        }
        .rq-drawer-title {
          font-size: 15px;
          font-weight: 700;
          color: ${T.text};
          margin: 0;
        }
        .rq-drawer-close {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          background: ${T.borderLt};
          border: none;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${T.textSec};
        }
        .rq-drawer-close:hover { background: ${T.border}; }
        .rq-drawer-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .rq-drawer-urgent {
          padding: 8px 12px;
          background: #fef2f2;
          border: 1px solid ${T.dangerBd};
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;
          color: ${T.dangerDk};
        }
        .rq-drawer-emp {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .rq-drawer-avatar {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 800;
        }
        .rq-drawer-name {
          font-size: 15px;
          font-weight: 700;
          color: ${T.text};
          display: block;
        }
        .rq-drawer-role {
          font-size: 12px;
          color: ${T.textSec};
        }
        .rq-drawer-badges {
          display: flex;
          gap: 6px;
        }
        .rq-badge {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 5px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        .rq-badge.lg {
          font-size: 12px;
          padding: 4px 10px;
        }
        .rq-drawer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: ${T.borderLt};
          border-radius: 6px;
          padding: 12px;
        }
        .rq-drawer-field {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .rq-drawer-label {
          font-size: 10px;
          font-weight: 600;
          color: ${T.muted};
          text-transform: uppercase;
          letter-spacing: 0.03em;
          display: block;
          margin-bottom: 3px;
        }
        .rq-drawer-value {
          font-size: 13px;
          font-weight: 600;
          color: ${T.text};
        }
        .rq-drawer-motif {
          display: flex;
          flex-direction: column;
        }
        .rq-drawer-motif-text {
          margin: 0;
          padding: 10px;
          background: ${T.borderLt};
          border-radius: 6px;
          font-size: 13px;
          color: ${T.text};
          line-height: 1.4;
        }
        .rq-drawer-comment {
          display: flex;
          flex-direction: column;
        }
        .rq-textarea {
          width: 100%;
          padding: 8px 10px;
          border: 1.5px solid ${T.border};
          border-radius: 6px;
          font-size: 13px;
          color: ${T.text};
          resize: vertical;
          font-family: inherit;
          min-height: 50px;
          box-sizing: border-box;
        }
        .rq-textarea:focus {
          outline: none;
          border-color: ${T.primary};
          box-shadow: 0 0 0 3px ${T.primaryLt};
        }
        .rq-textarea::placeholder { color: ${T.muted}; }
        .rq-drawer-actions {
          display: flex;
          gap: 8px;
        }
        .rq-drawer-resolved {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: ${T.borderLt};
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: ${T.textSec};
        }

        /* ============ Toast ============ */
        .rq-toast {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%) translateY(16px);
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          opacity: 0;
          pointer-events: none;
          transition: all .2s ease;
          z-index: 2000;
          white-space: nowrap;
          box-shadow: ${T.shadowMd};
        }
        .rq-toast.success { background: ${T.primaryDk}; color: ${T.white}; }
        .rq-toast.error { background: ${T.danger}; color: ${T.white}; }
        .rq-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
          pointer-events: auto;
        }

        /* ============ Responsive ============ */
        @media (max-width: 640px) {
          .rq-topbar { padding: 10px 12px; }
          .rq-stats-inline { display: none; }
          .rq-conges-link { display: none; }
          .rq-filters { padding: 6px 12px; }
          .rq-content { padding: 8px; }
          .rq-card-actions { display: none; }
          .rq-card-role { display: none; }
        }
      `}</style>
    </>
  )
}

// ============================================================
// REQUEST CARD COMPONENT
// ============================================================

function RequestCard({
  demande,
  isUrgent,
  onApprove,
  onRefuse,
  onSelect,
}: {
  demande: MockDemande
  isUrgent: boolean
  onApprove: (id: string) => void
  onRefuse: (id: string) => void
  onSelect: (id: string) => void
}) {
  const tc = TYPE_CFG[demande.type] || TYPE_CFG.conge
  const sc = STATUS_CFG[demande.status] || STATUS_CFG.pending
  const isPending = demande.status === 'pending'
  const role = getEmployeeRole(demande.employee_id)
  const avatarBg = role ? ROLE_PALETTE[role].bg : tc.color

  return (
    <div
      className={`rq-card ${isUrgent ? 'urgent' : ''} ${demande.status === 'approved' ? 'approved' : ''} ${demande.status === 'refused' ? 'refused' : ''}`}
      onClick={() => onSelect(demande.id)}
    >
      {/* Avatar */}
      <div className="rq-card-avatar" style={{ background: avatarBg }}>
        {demande.employee_initiales}
      </div>

      {/* Info */}
      <div className="rq-card-info">
        <div className="rq-card-top">
          <span className="rq-card-name">{demande.employee_name}</span>
          {role && <span className="rq-card-role">• {getRoleLabelFr(role)}</span>}
        </div>
        <div className="rq-card-meta">
          <span className="rq-card-type" style={{ color: tc.color }}>
            {tc.icon} {tc.label}
          </span>
          <span className="rq-card-sep">•</span>
          <span>{formatDate(demande.date)}</span>
          <span className="rq-card-sep">•</span>
          <span>{demande.creneau}</span>
        </div>
        {demande.motif && (
          <p className="rq-card-motif">💬 {demande.motif}</p>
        )}
      </div>

      {/* Status badge (non-pending) */}
      {!isPending && (
        <span className="rq-card-status" style={{ background: sc.bg, color: sc.color }}>
          {sc.label}
        </span>
      )}

      {/* Actions (pending only) */}
      {isPending && (
        <div className="rq-card-actions">
          <button
            className="rq-action-btn approve sm"
            title="Approuver"
            onClick={e => { e.stopPropagation(); onApprove(demande.id) }}
          >
            ✓
          </button>
          <button
            className="rq-action-btn refuse sm"
            title="Refuser"
            onClick={e => { e.stopPropagation(); onRefuse(demande.id) }}
          >
            ✗
          </button>
        </div>
      )}
    </div>
  )
}
