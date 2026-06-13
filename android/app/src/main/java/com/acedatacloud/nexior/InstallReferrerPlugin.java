package com.acedatacloud.nexior;

import android.content.Context;
import android.os.RemoteException;

import androidx.annotation.NonNull;

import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Reads the Google Play Install Referrer once on first launch so a deferred
 * deep link (invite link) can be attributed to a brand-new install. The
 * referrer string we set on the store URL ("inviter_id=...&click_id=...")
 * round-trips back here verbatim.
 */
@CapacitorPlugin(name = "InstallReferrer")
public class InstallReferrerPlugin extends Plugin {

    @PluginMethod
    public void getReferrer(final PluginCall call) {
        final Context context = getContext().getApplicationContext();
        final InstallReferrerClient client = InstallReferrerClient.newBuilder(context).build();
        client.startConnection(new InstallReferrerStateListener() {
            @Override
            public void onInstallReferrerSetupFinished(int responseCode) {
                try {
                    if (responseCode == InstallReferrerClient.InstallReferrerResponse.OK) {
                        ReferrerDetails details = client.getInstallReferrer();
                        JSObject ret = new JSObject();
                        ret.put("referrer", details.getInstallReferrer());
                        call.resolve(ret);
                    } else {
                        call.reject("install referrer unavailable: code " + responseCode);
                    }
                } catch (RemoteException e) {
                    call.reject("install referrer remote error", e);
                } finally {
                    try {
                        client.endConnection();
                    } catch (Exception ignored) {
                    }
                }
            }

            @Override
            public void onInstallReferrerServiceDisconnected() {
                // No-op: a one-shot read; we don't retry on disconnect.
            }
        });
    }
}
