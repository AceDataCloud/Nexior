package com.acedatacloud.nexior;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.RemoteException;
import java.util.concurrent.atomic.AtomicBoolean;

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
    private static final long REFERRER_TIMEOUT_MS = 3000;

    @PluginMethod
    public void getReferrer(final PluginCall call) {
        final Context context = getContext().getApplicationContext();
        final InstallReferrerClient client = InstallReferrerClient.newBuilder(context).build();
        new ReferrerRead(client, call).start();
    }

    // First launch awaits this call before mounting Vue. Every terminal path
    // must settle it, including a Play service that never calls back.
    static final class ReferrerRead implements InstallReferrerStateListener, Runnable {
        private final InstallReferrerClient client;
        private final PluginCall call;
        private final Handler handler = new Handler(Looper.getMainLooper());
        private final AtomicBoolean completed = new AtomicBoolean();

        ReferrerRead(InstallReferrerClient client, PluginCall call) {
            this.client = client;
            this.call = call;
        }

        void start() {
            handler.postDelayed(this, REFERRER_TIMEOUT_MS);
            try {
                client.startConnection(this);
            } catch (RuntimeException e) {
                reject("install referrer connection failed", e);
            }
        }

        @Override
        public void run() {
            reject("install referrer timed out", null);
        }

        @Override
        public void onInstallReferrerSetupFinished(int responseCode) {
            if (completed.get()) return;
            if (responseCode != InstallReferrerClient.InstallReferrerResponse.OK) {
                reject("install referrer unavailable: code " + responseCode, null);
                return;
            }
            try {
                ReferrerDetails details = client.getInstallReferrer();
                JSObject ret = new JSObject();
                ret.put("referrer", details.getInstallReferrer());
                if (completed.compareAndSet(false, true)) {
                    close();
                    call.resolve(ret);
                }
            } catch (RemoteException | RuntimeException e) {
                reject("install referrer read failed", e);
            }
        }

        @Override
        public void onInstallReferrerServiceDisconnected() {
            reject("install referrer service disconnected", null);
        }

        private void reject(String message, Exception error) {
            if (!completed.compareAndSet(false, true)) return;
            close();
            call.reject(message, error);
        }

        private void close() {
            handler.removeCallbacks(this);
            try {
                client.endConnection();
            } catch (RuntimeException ignored) {
                // Cleanup must not keep the JavaScript promise pending.
            }
        }
    }
}
