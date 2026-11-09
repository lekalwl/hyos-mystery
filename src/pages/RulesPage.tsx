import { SubPage } from '../components/SubPage';
import { useContent } from '../content/store';
import { DEFAULT_RULES } from '../data/rules';
import { Markdown } from '../lib/markdown';

export function RulesPage() {
  const { data } = useContent();
  return (
    <SubPage kind="rules" eyebrow="Rules" title="규칙">
      <div className="scroll-doc">
        <span className="roller roller-top" aria-hidden="true" />
        <article className="parchment md-doc" tabIndex={0} aria-label="규칙 문서">
          <Markdown source={data.rules?.trim() ? data.rules : DEFAULT_RULES} />
        </article>
        <span className="roller roller-bottom" aria-hidden="true" />
      </div>
    </SubPage>
  );
}
