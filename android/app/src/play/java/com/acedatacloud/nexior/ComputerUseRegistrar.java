package com.acedatacloud.nexior;

import com.getcapacitor.Plugin;

/**
 * `play` (Google Play) flavor: Computer Use is intentionally excluded because
 * Google Play policy disallows AccessibilityService use by autonomous agents,
 * so this returns null and MainActivity registers nothing. The `full`/sideload
 * flavor provides the real implementation.
 */
final class ComputerUseRegistrar {
    private ComputerUseRegistrar() {}

    static Class<? extends Plugin> pluginClass() {
        return null;
    }
}
