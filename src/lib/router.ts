import { useEffect, useState } from 'react';

/**
 * Minimal hash router.
 * Routes are flat names so they survive any static host:
 *   ''                 desk (main)
 *   'episodes'         episode library
 *   'episode-<id>'     visual-novel player
 *   'profiles'         character register   ('profile-<id>' opens one)
 *   'gallery'          gallery              ('gallery-<category>' filters)
 *   'rules'            rules scroll
 * Every navigation pushes a history entry, so browser Back works.
 */
export type Route =
  | { page: 'desk' }
  | { page: 'episodes' }
  | { page: 'player'; id: string }
  | { page: 'profiles'; id?: string }
  | { page: 'gallery'; category?: string }
  | { page: 'rules' }
  | { page: 'editor' };

export function parseHash(hash: string): Route {
  const h = decodeURIComponent(hash.replace(/^#/, ''));
  if (h === 'episodes') return { page: 'episodes' };
  if (h.startsWith('episode-')) return { page: 'player', id: h.slice(8) };
  if (h === 'profiles') return { page: 'profiles' };
  if (h.startsWith('profile-')) return { page: 'profiles', id: h.slice(8) };
  if (h === 'gallery') return { page: 'gallery' };
  if (h.startsWith('gallery-')) return { page: 'gallery', category: h.slice(8) };
  if (h === 'rules') return { page: 'rules' };
  if (h === 'editor') return { page: 'editor' };
  return { page: 'desk' };
}

export function navigate(name: string, opts: { replace?: boolean } = {}) {
  const target = name ? `#${name}` : location.pathname + location.search;
  if (opts.replace) {
    history.replaceState(null, '', name ? `#${name}` : target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else if (!name) {
    history.pushState(null, '', target);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = name;
  }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener('hashchange', on);
    window.addEventListener('popstate', on);
    return () => {
      window.removeEventListener('hashchange', on);
      window.removeEventListener('popstate', on);
    };
  }, []);
  return route;
}
