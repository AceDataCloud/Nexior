import i18n from '@/i18n';
import copyToClipboard from 'copy-to-clipboard';

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
    btn.className =
      'absolute top-1 right-1 z-10 rounded-md px-2 py-1 text-xs ' +
      'bg-zinc-800 text-white hover:bg-zinc-700 active:scale-95';
    btn.textContent = i18n.global.t('common.button.copy').toString();

    btn.addEventListener('click', () => {
      copyToClipboard(code.innerText);
      const old = btn.textContent!;
      btn.textContent = i18n.global.t('common.button.copied')?.toString();
      setTimeout(() => (btn.textContent = old), 5000);
    });

    wrapper.appendChild(btn);

    pre.dataset.hasCopy = '1';

    applyHighlight();
  });
};
