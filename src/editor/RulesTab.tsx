import type { ContentData } from '../content/types';
import { updateContent } from '../content/store';
import { DEFAULT_RULES } from '../data/rules';
import { Markdown } from '../lib/markdown';

const HELP = `# 제목   ## 01. 장 제목   ### 소제목   #### 작은 이름표
* 목록   > 주의 메모   !! 맺음말   ---  구분선
[[시민 진영|9명]] [[마피아 진영|2명]]  ← 수치 카드
:::카드 수사권  …  :::  ← 테두리 카드
**굵게**  *기울임*`;

export function RulesTab({ data }: { data: ContentData }) {
  const text = data.rules ?? DEFAULT_RULES;
  return (
    <div className="ed-rules">
      <div className="ed-rules-edit">
        <pre className="ed-rules-help">{HELP}</pre>
        <label htmlFor="ed-rules-area" className="sr-only">규칙 문서</label>
        <textarea
          id="ed-rules-area"
          className="ed-input"
          value={text}
          spellCheck={false}
          onChange={(e) => updateContent((d) => ({ ...d, rules: e.target.value }))}
        />
      </div>
      <div className="ed-rules-preview">
        <article className="parchment md-doc">
          <Markdown source={text} />
        </article>
      </div>
    </div>
  );
}
