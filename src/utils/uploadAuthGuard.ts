import { ensureLoggedIn } from './login';

type EnsureLoggedIn = () => boolean;

const uploadTarget = (target: EventTarget | null): Element | null => {
  if (!(target instanceof Element)) return null;
  if (target.matches('input[type="file"]')) return target;
  return target.closest('.el-upload');
};

const blockUpload = (event: Event, ensureLoggedIn: EnsureLoggedIn): void => {
  if (!uploadTarget(event.target) || ensureLoggedIn()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.type === 'change' && event.target instanceof HTMLInputElement) {
    event.target.value = '';
  }
};

export const installUploadAuthGuard = (
  target: Pick<Document, 'addEventListener' | 'removeEventListener'>,
  ensureLoggedIn: EnsureLoggedIn
): (() => void) => {
  const onClick = (event: Event) => blockUpload(event, ensureLoggedIn);
  const onChange = (event: Event) => blockUpload(event, ensureLoggedIn);
  target.addEventListener('click', onClick, true);
  target.addEventListener('change', onChange, true);

  let active = true;
  return () => {
    if (!active) return;
    active = false;
    target.removeEventListener('click', onClick, true);
    target.removeEventListener('change', onChange, true);
  };
};

export const ensureUploadAuthenticated = (): boolean => ensureLoggedIn();
