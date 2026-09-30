package com.acedatacloud.nexior;

import static org.junit.Assert.*;

import android.os.Bundle;
import android.os.RemoteException;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import com.android.installreferrer.api.InstallReferrerClient;
import com.android.installreferrer.api.InstallReferrerStateListener;
import com.android.installreferrer.api.ReferrerDetails;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class InstallReferrerPluginTest {
    private static final String REFERRER = "inviter_id=invite-test&click_id=click-test";

    @Test
    public void successfulReadPreservesReferrerAndClosesOnce() throws Exception {
        FakeClient client = new FakeClient();
        RecordingCall call = start(client);
        client.listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.OK);
        assertTrue(call.finished.await(1, TimeUnit.SECONDS));
        assertEquals(REFERRER, call.result.getString("referrer"));
        assertNull(call.error);
        client.listener.onInstallReferrerServiceDisconnected();
        assertEquals(1, call.completions);
        assertEquals(1, client.closes);
    }

    @Test
    public void missingCallbackTimesOutAndIgnoresLateSuccess() throws Exception {
        FakeClient client = new FakeClient();
        RecordingCall call = start(client);
        assertTrue("A silent Play service must not block first launch", call.finished.await(5, TimeUnit.SECONDS));
        assertEquals("install referrer timed out", call.error);
        client.listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.OK);
        assertEquals(0, client.reads);
        assertEquals(1, call.completions);
        assertEquals(1, client.closes);
    }

    @Test
    public void disconnectedServiceRejectsImmediately() throws Exception {
        FakeClient client = new FakeClient();
        RecordingCall call = start(client);
        client.listener.onInstallReferrerServiceDisconnected();
        assertTrue(call.finished.await(1, TimeUnit.SECONDS));
        assertEquals("install referrer service disconnected", call.error);
        client.listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.OK);
        assertEquals(1, call.completions);
        assertEquals(1, client.closes);
    }

    @Test
    public void unsupportedServiceRejectsAndCloses() throws Exception {
        FakeClient client = new FakeClient();
        RecordingCall call = start(client);
        client.listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.FEATURE_NOT_SUPPORTED);
        assertTrue(call.finished.await(1, TimeUnit.SECONDS));
        assertTrue(call.error.startsWith("install referrer unavailable:"));
        assertEquals(0, client.reads);
        assertEquals(1, client.closes);
    }

    @Test
    public void connectionFailureStillSettlesWhenCleanupThrows() throws Exception {
        FakeClient client = new FakeClient();
        client.failStart = true;
        client.failClose = true;
        RecordingCall call = start(client);
        assertTrue(call.finished.await(1, TimeUnit.SECONDS));
        assertEquals("install referrer connection failed", call.error);
        assertEquals(1, client.closes);
    }

    @Test
    public void remoteReadFailureRejectsAndCloses() throws Exception {
        FakeClient client = new FakeClient();
        client.failRead = true;
        RecordingCall call = start(client);
        client.listener.onInstallReferrerSetupFinished(InstallReferrerClient.InstallReferrerResponse.OK);
        assertTrue(call.finished.await(1, TimeUnit.SECONDS));
        assertEquals("install referrer read failed", call.error);
        assertEquals(1, call.completions);
        assertEquals(1, client.closes);
    }

    private RecordingCall start(FakeClient client) {
        RecordingCall call = new RecordingCall();
        new InstallReferrerPlugin.ReferrerRead(client, call).start();
        return call;
    }

    private static final class RecordingCall extends PluginCall {
        final CountDownLatch finished = new CountDownLatch(1);
        JSObject result;
        String error;
        int completions;

        RecordingCall() {
            super(null, "InstallReferrer", "test", "getReferrer", new JSObject());
        }

        @Override
        public void resolve(JSObject data) {
            result = data;
            completions++;
            finished.countDown();
        }

        @Override
        public void reject(String message, Exception exception) {
            error = message;
            completions++;
            finished.countDown();
        }
    }

    private static final class FakeClient extends InstallReferrerClient {
        InstallReferrerStateListener listener;
        int closes;
        int reads;
        boolean failStart;
        boolean failRead;
        boolean failClose;

        @Override
        public boolean isReady() { return true; }

        @Override
        public void startConnection(InstallReferrerStateListener listener) {
            this.listener = listener;
            if (failStart) throw new IllegalStateException("service unavailable");
        }

        @Override
        public void endConnection() {
            closes++;
            if (failClose) throw new IllegalStateException("already disconnected");
        }

        @Override
        public ReferrerDetails getInstallReferrer() throws RemoteException {
            reads++;
            if (failRead) throw new RemoteException("service disconnected during read");
            Bundle data = new Bundle();
            data.putString("install_referrer", REFERRER);
            return new ReferrerDetails(data);
        }
    }
}
