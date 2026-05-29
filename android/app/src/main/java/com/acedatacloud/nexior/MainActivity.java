package com.acedatacloud.nexior;

import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity is the main entry point for the Nexior Android application.
 * It extends BridgeActivity to provide Capacitor functionality.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);
    }
}
