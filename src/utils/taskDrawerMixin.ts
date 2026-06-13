/**
 * Shared state for a service Layout's mobile config drawer and the centered
 * `NoTasks` empty state. Only one service Layout is mounted at a time, so a
 * module-level reactive singleton is safe.
 *
 * - `empty` is set by `NoTasks` while it is mounted, so the Layout can hide the
 *   floating magic button (the centered wand becomes the only "new task" entry).
 * - `open` mirrors the drawer's open flag; `NoTasks` opens it on tap, exactly
 *   like the top-right magic button.
 */
import { defineComponent, reactive } from 'vue';

export const taskDrawerState = reactive({
  empty: false,
  open: false
});

/** Open the config drawer — same effect as tapping the top-right magic button. */
export function openTaskDrawer(): void {
  taskDrawerState.open = true;
}

/**
 * Install on a service Layout. Exposes `drawer` (a computed proxy so existing
 * `v-model="drawer"` / `@click="drawer = true"` keep working) and `tasksEmpty`
 * (used to hide the floating magic button when the centered wand is shown).
 */
export const taskDrawerMixin = defineComponent({
  computed: {
    drawer: {
      get(): boolean {
        return taskDrawerState.open;
      },
      set(value: boolean) {
        taskDrawerState.open = value;
      }
    },
    tasksEmpty(): boolean {
      return taskDrawerState.empty;
    }
  },
  beforeUnmount() {
    // Never inherit a stale open drawer when switching services.
    taskDrawerState.open = false;
  }
});

export default taskDrawerMixin;
