// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
const auth = vi.hoisted(() => ({ allowed: true, ensure: vi.fn(() => auth.allowed) }));

vi.mock('./login', () => ({ ensureLoggedIn: auth.ensure }));

import { ensureUploadAuthenticated, installUploadAuthGuard } from './uploadAuthGuard';

const mountUpload = () => {
  const upload = document.createElement('div');
  upload.className = 'el-upload';
  const button = document.createElement('button');
  const input = document.createElement('input');
  input.type = 'file';
  upload.append(button, input);
  document.body.appendChild(upload);
  return { upload, button, input };
};

afterEach(() => {
  auth.allowed = true;
  auth.ensure.mockClear();
  document.body.innerHTML = '';
});

describe('installUploadAuthGuard', () => {
  it('blocks a signed-out upload click and starts login', () => {
    const ensure = vi.fn(() => false);
    const off = installUploadAuthGuard(document, ensure);
    const { button } = mountUpload();
    const downstream = vi.fn();
    button.addEventListener('click', downstream);

    const allowed = button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(allowed).toBe(false);
    expect(ensure).toHaveBeenCalledOnce();
    expect(downstream).not.toHaveBeenCalled();
    off();
  });

  it('allows authenticated upload clicks', () => {
    const ensure = vi.fn(() => true);
    const off = installUploadAuthGuard(document, ensure);
    const { button } = mountUpload();
    const downstream = vi.fn();
    button.addEventListener('click', downstream);

    const allowed = button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(allowed).toBe(true);
    expect(downstream).toHaveBeenCalledOnce();
    off();
  });

  it('blocks a file change fallback and clears the selected value', () => {
    const ensure = vi.fn(() => false);
    const off = installUploadAuthGuard(document, ensure);
    const { input } = mountUpload();
    const downstream = vi.fn();
    input.addEventListener('change', downstream);
    Object.defineProperty(input, 'value', { value: 'selected.png', writable: true });

    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

    expect(input.value).toBe('');
    expect(downstream).not.toHaveBeenCalled();
    off();
  });

  it('guards upload elements mounted after installation and stops after cleanup', () => {
    const ensure = vi.fn(() => false);
    const off = installUploadAuthGuard(document, ensure);
    const { button } = mountUpload();

    button.click();
    expect(ensure).toHaveBeenCalledOnce();

    off();
    button.click();
    expect(ensure).toHaveBeenCalledOnce();
  });
});

describe('ensureUploadAuthenticated', () => {
  it('delegates protected direct uploads to deferred auth', () => {
    auth.allowed = false;
    expect(ensureUploadAuthenticated()).toBe(false);
    expect(auth.ensure).toHaveBeenCalledOnce();
  });
});
