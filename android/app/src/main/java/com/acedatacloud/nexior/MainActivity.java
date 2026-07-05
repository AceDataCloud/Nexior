package com.acedatacloud.nexior;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;

/**
 * MainActivity is the main entry point for the Nexior Android application.
 * It extends BridgeActivity to provide Capacitor functionality.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Register the custom Play Install Referrer plugin before the bridge
        // initializes so it's available to the WebView on first launch.
        registerPlugin(InstallReferrerPlugin.class);
        // Computer Use (screen capture + gesture control via AccessibilityService)
        // ships only in the `full`/sideload flavor; pluginClass() is null on Play.
        Class<? extends Plugin> computerUse = ComputerUseRegistrar.pluginClass();
        if (computerUse != null) {
            registerPlugin(computerUse);
        }
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
