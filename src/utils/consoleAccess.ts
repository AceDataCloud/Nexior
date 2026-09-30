import { isMainOfficial } from './is';
import { isDesktop, isNative } from './surface';

/** Managed console pages are available on Studio and in the packaged apps.
 * App renderers use local origins, so the web host check alone rejects them.
 */
export const canAccessManagedConsole = (): boolean => isMainOfficial() || isNative() || isDesktop();
