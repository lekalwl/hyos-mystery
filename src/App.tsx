import { lazy, Suspense, useEffect } from 'react';
import { useRoute, navigate } from './lib/router';
import { Desk } from './components/desk/Desk';
import { EpisodesPage } from './pages/EpisodesPage';
import { PlayerPage } from './pages/PlayerPage';
import { ProfilesPage } from './pages/ProfilesPage';
import { GalleryPage } from './pages/GalleryPage';
import { RulesPage } from './pages/RulesPage';
import { loadContent, useContent, assetUrl } from './content/store';
import { MenuMusic } from './components/MenuMusic';

// The editor is compiled only into the operator build; the public build
// (vite --mode public) replaces this with null and drops the code.
const EditorApp = import.meta.env.VITE_PUBLIC_BUILD === '1' ? null : lazy(() => import('./editor/EditorApp'));

const TITLES: Record<string, string> = {
  desk: 'Grayhaven — Murder Mystery',
  episodes: '에피소드 · Grayhaven',
  player: '에피소드 · Grayhaven',
  profiles: '인물 · Grayhaven',
  gallery: '갤러리 · Grayhaven',
  rules: '규칙 · Grayhaven',
  editor: '편집기 · Grayhaven',
};

let loading = false;

export function App() {
  const route = useRoute();
  const { source, data } = useContent();

  useEffect(() => {
    if (!loading) { loading = true; loadContent(); }
  }, []);

  useEffect(() => {
    document.title = TITLES[route.page];
    window.scrollTo(0, 0);
  }, [route.page]);

  const page = (() => {
    switch (route.page) {
      case 'episodes': return <EpisodesPage />;
      case 'player': return <PlayerPage key={route.id} id={route.id} />;
      case 'profiles': return <ProfilesPage id={route.id} />;
      case 'gallery': return <GalleryPage category={route.category} />;
      case 'rules': return <RulesPage />;
      case 'editor':
        return EditorApp ? (
          <Suspense fallback={<div className="editor-loading">편집기를 여는 중…</div>}><EditorApp /></Suspense>
        ) : <Desk />;
      default: return <Desk />;
    }
  })();

  return (
    <>
      {page}
      {route.page !== 'player' && route.page !== 'editor' && <MenuMusic src={assetUrl(data.menuBgm)} />}
      {source === 'draft' && route.page !== 'editor' && route.page !== 'player' && (
        <button type="button" className="draft-badge" onClick={() => navigate('editor')}>
          편집본 보는 중 · 편집기로
        </button>
      )}
    </>
  );
}
