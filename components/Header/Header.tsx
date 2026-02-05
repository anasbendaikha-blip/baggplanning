'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import NavTabs from './NavTabs';
import UserMenu, { resolveUser, type UserInfo } from './UserMenu';
import styles from './header.module.css';

// All nav items for mobile drawer
const ALL_NAV_ITEMS = [
  { href: '/titulaire', label: 'Tableau de bord', icon: '📊' },
  { href: '/titulaire/equipe', label: 'Équipe', icon: '👥', section: 'Gestion' },
  { href: '/titulaire/disponibilites', label: 'Disponibilités', icon: '📅', section: 'Gestion' },
  { href: '/titulaire/demandes', label: 'Demandes', icon: '📋', section: 'Gestion' },
  { href: '/titulaire/planning', label: 'Planning', icon: '📆' },
  { href: '/titulaire/assistant-planning', label: 'Assistant', icon: '✨', highlight: true },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Resolve user on mount
  useEffect(() => {
    setUser(resolveUser());
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  const handleLogout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('baggplanning_session');
      localStorage.removeItem('baggplanning_user');
      sessionStorage.clear();
    }
    router.push('/auth/login');
  }, [router]);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen(prev => !prev);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  // Group items by section for mobile drawer
  const mainItems = ALL_NAV_ITEMS.filter(i => !i.section);
  const gestionItems = ALL_NAV_ITEMS.filter(i => i.section === 'Gestion');

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerInner}>
          {/* ── Branding ── */}
          <Link href="/titulaire" className={styles.brand}>
            <span className={styles.brandIcon}>💊</span>
            <div className={styles.brandText}>
              <h1 className={styles.brandTitle}>BaggPlanning</h1>
              <p className={styles.brandSub}>
                Espace Titulaire — {user?.name || 'Chargement...'}
              </p>
            </div>
          </Link>

          {/* ── Navigation (desktop) ── */}
          <NavTabs />

          {/* ── User area (desktop) ── */}
          <div className={styles.userArea}>
            <UserMenu onLogout={handleLogout} />

            {/* Hamburger (mobile only) */}
            <button
              className={`${styles.hamburger} ${drawerOpen ? styles.hamburgerOpen : ''}`}
              onClick={toggleDrawer}
              aria-label={drawerOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={drawerOpen}
            >
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
              <span className={styles.hamburgerLine} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {drawerOpen && (
        <>
          <div className={styles.drawerOverlay} onClick={closeDrawer} />
          <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Menu navigation">
            {/* Drawer header */}
            <div className={styles.drawerHeader}>
              <div
                className={styles.drawerAvatar}
                style={{ backgroundColor: user?.roleColor?.bg || '#6366f1' }}
              >
                {user?.initials || 'IM'}
              </div>
              <div className={styles.drawerUserInfo}>
                <span className={styles.drawerUserName}>{user?.name || 'Utilisateur'}</span>
                <span className={styles.drawerUserRole}>
                  {user?.role === 'Preparateur'
                    ? 'Préparateur'
                    : user?.role === 'Etudiant'
                      ? 'Étudiant'
                      : user?.role || 'Pharmacien'}
                </span>
              </div>
              <button className={styles.drawerClose} onClick={closeDrawer} aria-label="Fermer">
                ✕
              </button>
            </div>

            {/* Drawer navigation */}
            <div className={styles.drawerNav}>
              {/* Main items */}
              <div className={styles.drawerSection}>
                {mainItems
                  .filter(i => !('highlight' in i && i.highlight))
                  .map(item => {
                    const isActive = pathname === item.href || (item.href !== '/titulaire' && pathname?.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`}
                        onClick={closeDrawer}
                      >
                        <span className={styles.drawerLinkIcon}>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </div>

              {/* Gestion section */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionLabel}>Gestion</div>
                {gestionItems.map(item => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${styles.drawerLink} ${isActive ? styles.drawerLinkActive : ''}`}
                      onClick={closeDrawer}
                    >
                      <span className={styles.drawerLinkIcon}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Assistant (highlight) */}
              <div className={styles.drawerSection}>
                {mainItems
                  .filter(i => 'highlight' in i && i.highlight)
                  .map(item => {
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.drawerLink} ${styles.drawerLinkHighlight} ${isActive ? styles.drawerLinkActive : ''}`}
                        onClick={closeDrawer}
                      >
                        <span className={styles.drawerLinkIcon}>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
              </div>
            </div>

            {/* Drawer footer */}
            <div className={styles.drawerFooter}>
              <button className={styles.drawerLogout} onClick={handleLogout}>
                <span className={styles.drawerLinkIcon}>🚪</span>
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
