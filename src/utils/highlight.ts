import i18n from '@/i18n';
import copyToClipboard from 'copy-to-clipboard';

const COPY_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>';
const CHECK_SVG =
  '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>';

export const highlight = async (el: HTMLElement) => {
  const hl = (await import('highlight.js/lib/common')).default;
  const blocks = el.querySelectorAll<HTMLElement>('pre code');

  blocks.forEach((code) => {
    const pre = code.parentElement as HTMLElement;
    if (!pre) return;

    // VueMarkdown already bakes highlighting into the HTML (`hljs` class +
    // token spans). Re-running highlight.js on that would nest spans, so here
    // we only need to add the copy button. CodeSnippet renders plain code
    // without the `hljs` class — those we still highlight ourselves below.
    const prehighlighted = code.classList.contains('hljs');

    // highlight.js v11 refuses to re-highlight a node once `data-highlighted`
    // is set, even if the inner text has changed (e.g. user switches a
    // language tab in the API-code dialog). Reset the marker + previously
    // applied hljs classes so each render is highlighted fresh.
    if (!prehighlighted && code.dataset.highlighted) {
      delete code.dataset.highlighted;
      code.className = code.className
        .split(/\s+/)
        .filter((c) => c && c !== 'hljs' && !c.startsWith('language-'))
        .join(' ');
    }

    const applyHighlight = () => {
      if (prehighlighted) return;
      if ('highlightElement' in hl) hl.highlightElement(code);
      else (hl as any).highlightBlock(code);
    };

    if (pre.dataset.hasCopy === '1') {
      applyHighlight();
      return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'relative';
    pre.parentNode!.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);

    pre.classList.add('overflow-auto');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.copyBtn = '1';
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', i18n.global.t('common.button.copy').toString());
    btn.innerHTML = COPY_SVG;
    let resetTimer: number | undefined;

    btn.addEventListener('click', async () => {
      try {
        if (!(await copyToClipboard(code.innerText))) return;
      } catch {
        return;
      }
      btn.classList.add('is-copied');
      btn.setAttribute('aria-label', i18n.global.t('common.message.copied').toString());
      btn.innerHTML = CHECK_SVG;
      if (resetTimer !== undefined) window.clearTimeout(resetTimer);
      resetTimer = window.setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.setAttribute('aria-label', i18n.global.t('common.button.copy').toString());
        btn.innerHTML = COPY_SVG;
        resetTimer = undefined;
      }, 3000);
    });

    wrapper.appendChild(btn);

    pre.dataset.hasCopy = '1';

    applyHighlight();
  });
};
