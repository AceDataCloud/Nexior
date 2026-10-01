// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createOrbRenderer } from './motionOrbRenderer';
import MotionOrb from './MotionOrb.vue';

vi.mock('./motionOrbRenderer', () => ({ createOrbRenderer: vi.fn() }));
const draw = vi.fn();
const dispose = vi.fn();
let reduced = false;
let mediaChange: () => void;
let intersection: IntersectionObserverCallback;
const disconnect = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  reduced = false;
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  vi.stubGlobal(
    'requestAnimationFrame',
    vi.fn(() => 12)
  );
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      get matches() {
        return reduced;
      },
      addEventListener: (_event: string, callback: () => void) => {
        mediaChange = callback;
      },
      removeEventListener: vi.fn()
    }))
  );
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: IntersectionObserverCallback) {
        intersection = callback;
      }
      observe = vi.fn();
      disconnect = disconnect;
    }
  );
  vi.mocked(createOrbRenderer).mockReturnValue({ draw, dispose });
});
afterEach(() => vi.unstubAllGlobals());

describe('MotionOrb lifecycle', () => {
  it('renders once but never starts a loop with reduced motion', () => {
    reduced = true;
    const wrapper = mount(MotionOrb);
    expect(draw).toHaveBeenCalledOnce();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    wrapper.unmount();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('stops when hidden or offscreen and resumes only when visible', () => {
    const wrapper = mount(MotionOrb);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    intersection([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(cancelAnimationFrame).toHaveBeenCalledWith(12);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    intersection([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    wrapper.unmount();
    expect(disconnect).toHaveBeenCalledOnce();
    expect(dispose).toHaveBeenCalledOnce();
    document.dispatchEvent(new Event('visibilitychange'));
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });

  it('reacts to the motion preference and pause prop', async () => {
    const wrapper = mount(MotionOrb);
    reduced = true;
    mediaChange();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(12);
    reduced = false;
    mediaChange();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    await wrapper.setProps({ animated: false });
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });

  it('uses the static fallback when WebGL is unavailable', () => {
    vi.mocked(createOrbRenderer).mockReturnValue(undefined);
    const wrapper = mount(MotionOrb);
    expect(wrapper.attributes('data-renderer')).toBe('static');
    expect(requestAnimationFrame).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('switches to a fallback on context loss and restores without a duplicate loop', async () => {
    const wrapper = mount(MotionOrb);
    const lost = new Event('webglcontextlost', { cancelable: true });
    wrapper.get('canvas').element.dispatchEvent(lost);
    await nextTick();
    expect(lost.defaultPrevented).toBe(true);
    expect(wrapper.attributes('data-renderer')).toBe('static');
    wrapper.get('canvas').element.dispatchEvent(new Event('webglcontextrestored'));
    await nextTick();
    expect(wrapper.attributes('data-renderer')).toBe('webgl');
    expect(createOrbRenderer).toHaveBeenCalledTimes(2);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    wrapper.unmount();
  });
});
