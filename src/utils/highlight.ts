import i18n from '@/i18n';
import copyToClipboard from 'copy-to-clipboard';

export const highlight = async (el: HTMLElement) => {
  const hl = (await import('highlight.js')).default;
  console.debug('highlight.js loaded');
  const blocks = el.querySelectorAll('pre code');
  blocks.forEach((block) => {
    // create the copy button
    const copy = document.createElement('button');
    copy.innerHTML = i18n.global.t('common.button.copy').toString();
    // add the event listener to each click
    copy.addEventListener('click', () => {
      // @ts-ignore
      copyToClipboard(block.innerText);
    });
    // append the copy button to each code block
    // check already has copy button
    if (!block.parentElement?.querySelector('button')) {
      block.parentElement?.prepend(copy);
    }
    // @ts-ignore
    hl.highlightBlock(block);
  });
};
