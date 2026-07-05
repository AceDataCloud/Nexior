package com.acedatacloud.nexior;

import com.getcapacitor.Plugin;

/**
 * `full` (sideload) flavor: exposes the Computer Use Capacitor plugin so
 * MainActivity can register it. The `play` flavor provides a no-op counterpart
 * returning null, so the Google Play build ships without Computer Use.
 */
final class ComputerUseRegistrar {
    private ComputerUseRegistrar() {}

    static Class<? extends Plugin> pluginClass() {
        return ComputerUsePlugin.class;
    }
}
