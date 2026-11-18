import { shallowRef, triggerRef, type Directive } from 'vue';

// The composer grows with text/attachments. Share its element so the launcher
// can avoid it without scanning or observing the entire DOM.
export const supportObstacleElement = shallowRef<HTMLElement>();
export const supportObstacle: Directive<HTMLElement> = {
  mounted(element) {
    supportObstacleElement.value = element;
  },
  updated(element) {
    if (supportObstacleElement.value === element) triggerRef(supportObstacleElement);
  },
  unmounted(element) {
    if (supportObstacleElement.value === element) supportObstacleElement.value = undefined;
  }
};
