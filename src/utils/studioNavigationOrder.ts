import { shallowRef } from 'vue';

const storageKey = 'studio-navigation-order';
const dragType = 'application/x-studio-navigation';
export const studioNavigationOrder = shallowRef<string[]>([]);

export function loadStudioNavigationOrder() {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (Array.isArray(stored)) studioNavigationOrder.value = stored.filter((key) => typeof key === 'string');
  } catch {
    // Use the current order when storage is unavailable or invalid.
  }
}

export function startStudioNavigationDrag(event: DragEvent, key: string) {
  event.dataTransfer?.setData(dragType, key);
}

export function dropStudioNavigation(
  event: { dataTransfer: Pick<DataTransfer, 'getData'> | null },
  target: string,
  availableKeys: string[],
  allowedSources = availableKeys
) {
  const source = event.dataTransfer?.getData(dragType);
  if (!source || source === target || !allowedSources.includes(source)) return;
  const order = [...new Set([...studioNavigationOrder.value, ...availableKeys])];
  const targetIndex = order.indexOf(target);
  order.splice(order.indexOf(source), 1);
  order.splice(targetIndex, 0, source);
  studioNavigationOrder.value = order;
  try {
    localStorage.setItem(storageKey, JSON.stringify(order));
  } catch {
    // Keep the new order for this session when browser storage is disabled.
  }
}
