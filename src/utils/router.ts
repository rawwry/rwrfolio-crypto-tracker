import { useState, useEffect, useCallback } from 'react';

export type TabType = 'dashboard' | 'transactions' | 'assets' | 'analytics' | 'taxes';

export interface RouteInfo {
  tab: TabType;
  coinFilter: string;
  isSettingsOpen: boolean;
  isChangelogOpen: boolean;
  pathname: string;
}

/**
 * Detects Home Assistant Ingress base path if present (e.g. /api/hassio_ingress/<token>)
 */
export function getBasePath(): string {
  if (typeof window === 'undefined') return '';
  const pathname = window.location.pathname;
  const ingressMatch = pathname.match(/^(\/api\/hassio_ingress\/[^/]+)/);
  if (ingressMatch) {
    return ingressMatch[1];
  }
  return '';
}

/**
 * Strips the base path (e.g. Ingress prefix) from a full pathname
 */
export function stripBasePath(pathname: string): string {
  const base = getBasePath();
  if (base && pathname.startsWith(base)) {
    const stripped = pathname.substring(base.length);
    return stripped.startsWith('/') ? stripped : `/${stripped}`;
  }
  return pathname;
}

/**
 * Builds a full path including base path (if any)
 */
export function buildFullPath(subpath: string): string {
  const base = getBasePath();
  const cleanSubpath = subpath.startsWith('/') ? subpath : `/${subpath}`;
  if (!base) return cleanSubpath;
  return `${base}${cleanSubpath === '/' ? '' : cleanSubpath}`;
}

/**
 * Maps a tab to its primary URL subpath
 */
export function tabToPath(tab: TabType): string {
  switch (tab) {
    case 'dashboard':
      return '/';
    case 'transactions':
      return '/transactions';
    case 'assets':
      return '/coins';
    case 'analytics':
      return '/analytics';
    case 'taxes':
      return '/taxes';
    default:
      return '/';
  }
}

/**
 * Document title corresponding to each view
 */
export function getDocumentTitle(tab: TabType, modal?: 'settings' | 'changelog'): string {
  if (modal === 'settings') return 'rwrfolio • Einstellungen';
  if (modal === 'changelog') return 'rwrfolio • Versionsverlauf';

  switch (tab) {
    case 'dashboard':
      return 'rwrfolio • Krypto Portfolio Tracker';
    case 'transactions':
      return 'rwrfolio • Transaktionen';
    case 'assets':
      return 'rwrfolio • Coin-Bestand';
    case 'analytics':
      return 'rwrfolio • Portfolio-Analysen';
    case 'taxes':
      return 'rwrfolio • Steuern & Haltefristen (§ 23 EStG)';
    default:
      return 'rwrfolio';
  }
}

/**
 * Resolves pathname and hash into a TabType and modal flags
 */
export function parseCurrentRoute(): RouteInfo {
  if (typeof window === 'undefined') {
    return {
      tab: 'dashboard',
      coinFilter: 'ALL',
      isSettingsOpen: false,
      isChangelogOpen: false,
      pathname: '/',
    };
  }

  const rawPath = stripBasePath(window.location.pathname);
  const cleanPath = rawPath.toLowerCase().replace(/\/+$/, '') || '/';
  const hash = (window.location.hash || '').toLowerCase().replace(/^#\/?/, '');
  const searchParams = new URLSearchParams(window.location.search);
  const coinParam = searchParams.get('coin') || searchParams.get('asset') || searchParams.get('filter') || 'ALL';

  const isSettingsOpen = cleanPath === '/settings' || hash === 'settings' || searchParams.get('modal') === 'settings';
  const isChangelogOpen = cleanPath === '/changelog' || hash === 'changelog' || searchParams.get('modal') === 'changelog';

  let tab: TabType = 'dashboard';

  // Check path first, then hash fallback
  const check = (p: string): TabType | null => {
    if (p === '/transactions' || p === 'transactions' || p === '/transaktionen' || p === 'transaktionen') {
      return 'transactions';
    }
    if (p === '/coins' || p === 'coins' || p === '/assets' || p === 'assets' || p === '/bestand' || p === 'bestand') {
      return 'assets';
    }
    if (p === '/analytics' || p === 'analytics' || p === '/analysen' || p === 'analysen' || p === '/charts') {
      return 'analytics';
    }
    if (p === '/taxes' || p === 'taxes' || p === '/steuern' || p === 'steuern' || p === '/steuer') {
      return 'taxes';
    }
    if (p === '' || p === '/' || p === '/dashboard' || p === 'dashboard' || p === '/overview' || p === 'overview' || p === '/uebersicht') {
      return 'dashboard';
    }
    return null;
  };

  const fromPath = check(cleanPath);
  if (fromPath) {
    tab = fromPath;
  } else {
    const fromHash = check(hash);
    if (fromHash) {
      tab = fromHash;
    } else {
      tab = 'dashboard';
    }
  }

  return {
    tab,
    coinFilter: coinParam,
    isSettingsOpen,
    isChangelogOpen,
    pathname: cleanPath,
  };
}

/**
 * React Hook for full SPA routing, browser Back/Forward (popstate), and URL sync
 */
export function useAppRouter() {
  const [route, setRoute] = useState<RouteInfo>(() => parseCurrentRoute());

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const updated = parseCurrentRoute();
      setRoute(updated);
      document.title = getDocumentTitle(
        updated.tab,
        updated.isSettingsOpen ? 'settings' : updated.isChangelogOpen ? 'changelog' : undefined
      );
    };

    window.addEventListener('popstate', handlePopState);
    
    // Initial title update
    document.title = getDocumentTitle(
      route.tab,
      route.isSettingsOpen ? 'settings' : route.isChangelogOpen ? 'changelog' : undefined
    );

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Navigate to a specific tab
  const navigateToTab = useCallback((targetTab: TabType, coin?: string, options?: { replace?: boolean }) => {
    const subpath = tabToPath(targetTab);
    const search = coin && coin !== 'ALL' ? `?coin=${encodeURIComponent(coin)}` : '';
    const fullUrl = buildFullPath(subpath) + search;

    const currentFull = window.location.pathname + window.location.search;
    const shouldReplace = options?.replace || currentFull === fullUrl;

    if (shouldReplace) {
      window.history.replaceState({ tab: targetTab, coin: coin || 'ALL' }, '', fullUrl);
    } else {
      window.history.pushState({ tab: targetTab, coin: coin || 'ALL' }, '', fullUrl);
    }

    setRoute({
      tab: targetTab,
      coinFilter: coin || 'ALL',
      isSettingsOpen: false,
      isChangelogOpen: false,
      pathname: subpath,
    });

    document.title = getDocumentTitle(targetTab);
  }, []);

  // Open Settings modal with URL synchronization
  const openSettings = useCallback(() => {
    const fullUrl = buildFullPath('/settings');
    window.history.pushState({ modal: 'settings' }, '', fullUrl);
    setRoute(prev => ({ ...prev, isSettingsOpen: true, isChangelogOpen: false }));
    document.title = getDocumentTitle(route.tab, 'settings');
  }, [route.tab]);

  // Close Settings modal
  const closeSettings = useCallback(() => {
    if (stripBasePath(window.location.pathname) === '/settings') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        const subpath = tabToPath(route.tab);
        window.history.replaceState({ tab: route.tab }, '', buildFullPath(subpath));
        setRoute(prev => ({ ...prev, isSettingsOpen: false }));
        document.title = getDocumentTitle(route.tab);
      }
    } else {
      setRoute(prev => ({ ...prev, isSettingsOpen: false }));
      document.title = getDocumentTitle(route.tab);
    }
  }, [route.tab]);

  // Open Changelog modal with URL synchronization
  const openChangelog = useCallback(() => {
    const fullUrl = buildFullPath('/changelog');
    window.history.pushState({ modal: 'changelog' }, '', fullUrl);
    setRoute(prev => ({ ...prev, isChangelogOpen: true, isSettingsOpen: false }));
    document.title = getDocumentTitle(route.tab, 'changelog');
  }, [route.tab]);

  // Close Changelog modal
  const closeChangelog = useCallback(() => {
    if (stripBasePath(window.location.pathname) === '/changelog') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        const subpath = tabToPath(route.tab);
        window.history.replaceState({ tab: route.tab }, '', buildFullPath(subpath));
        setRoute(prev => ({ ...prev, isChangelogOpen: false }));
        document.title = getDocumentTitle(route.tab);
      }
    } else {
      setRoute(prev => ({ ...prev, isChangelogOpen: false }));
      document.title = getDocumentTitle(route.tab);
    }
  }, [route.tab]);

  // Set coin filter on transactions tab
  const setCoinFilter = useCallback((coin: string) => {
    const search = coin && coin !== 'ALL' ? `?coin=${encodeURIComponent(coin)}` : '';
    const fullUrl = buildFullPath('/transactions') + search;
    window.history.replaceState({ tab: 'transactions', coin }, '', fullUrl);
    setRoute(prev => ({ ...prev, tab: 'transactions', coinFilter: coin }));
  }, []);

  return {
    activeTab: route.tab,
    selectedAssetFilter: route.coinFilter,
    isSettingsOpen: route.isSettingsOpen,
    isChangelogOpen: route.isChangelogOpen,
    setActiveTab: navigateToTab,
    openSettings,
    closeSettings,
    openChangelog,
    closeChangelog,
    setCoinFilter,
  };
}
