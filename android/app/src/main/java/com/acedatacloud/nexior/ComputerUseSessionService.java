package com.acedatacloud.nexior;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

/**
 * Foreground service that keeps a Computer-Use session alive while the AI agent
 * drives OTHER apps. When the user asks the assistant to operate the phone,
 * Nexior itself must move to the background (so the screenshot captures the
 * TARGET app, not the chat) — and a backgrounded WebView's JS loop can be
 * throttled/suspended by Doze and OEM battery managers. Running as a foreground
 * service (with an ongoing notification) raises the process to foreground
 * importance so the loop + network stay hot for the whole task.
 *
 * The notification is also the safety surface: its "Stop" action broadcasts
 * {@link #ACTION_CU_STOP}, which {@link ComputerUsePlugin} relays to JS so the
 * app disables Computer Use and clears its always-allow grants — a one-tap kill
 * switch the model cannot bypass. Sideload/full flavor only (see the plan doc).
 */
public class ComputerUseSessionService extends Service {

    private static final String CHANNEL_ID = "computer_use_session";
    private static final int NOTIFICATION_ID = 4711;

    /** Intent action to start the session (default). */
    public static final String ACTION_START = "com.acedatacloud.nexior.CU_SESSION_START";
    /** Intent action fired by the notification's Stop button. */
    public static final String ACTION_STOP = "com.acedatacloud.nexior.CU_SESSION_STOP";
    /** Broadcast sent (in-app only) when the user taps Stop, so JS can react. */
    public static final String ACTION_CU_STOP = "com.acedatacloud.nexior.CU_STOP";

    /** Auto-stop the session after this much inactivity (no new action). */
    private static final long IDLE_TIMEOUT_MS = 90_000L;

    private final Handler idleHandler = new Handler(Looper.getMainLooper());
    private final Runnable idleStop = this::stopSelfAndForeground;

    public static void start(Context ctx) {
        Intent i = new Intent(ctx, ComputerUseSessionService.class).setAction(ACTION_START);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ctx.startForegroundService(i);
            } else {
                ctx.startService(i);
            }
        } catch (Exception e) {
            // Android 12+ can throw ForegroundServiceStartNotAllowedException if
            // we try to START a new session while backgrounded. The first action
            // of a task runs while Nexior is foreground, so this is rare; swallow
            // it — the action still runs (a11y service is independent), just
            // without the extra background-liveness guarantee. Never crash.
            android.util.Log.w("ComputerUseSession", "startForegroundService blocked: " + e.getMessage());
        }
    }

    public static void stop(Context ctx) {
        ctx.stopService(new Intent(ctx, ComputerUseSessionService.class));
    }

    @Override
    public int onStartCommand(@Nullable Intent intent, int flags, int startId) {
        if (intent != null && ACTION_STOP.equals(intent.getAction())) {
            // Authoritative kill switch: block all native actions IMMEDIATELY
            // (before the JS layer is even told), then tell JS, then tear down.
            ComputerUseAccessibilityService.setSessionStopped(true);
            Intent broadcast = new Intent(ACTION_CU_STOP).setPackage(getPackageName());
            sendBroadcast(broadcast);
            stopSelfAndForeground();
            return START_NOT_STICKY;
        }
        startForegroundWithNotification();
        // Reset the inactivity timer on every action so the session stays up for
        // the duration of the task and auto-stops ~90s after the last action
        // (so a finished task doesn't leave the notification up forever).
        idleHandler.removeCallbacks(idleStop);
        idleHandler.postDelayed(idleStop, IDLE_TIMEOUT_MS);
        // Don't auto-restart if the OS kills us; a new session is started
        // explicitly by the JS bridge on the next Computer-Use action.
        return START_NOT_STICKY;
    }

    @Override
    public void onDestroy() {
        idleHandler.removeCallbacks(idleStop);
        super.onDestroy();
    }

    private void startForegroundWithNotification() {
        createChannel();

        Intent stopIntent = new Intent(this, ComputerUseSessionService.class).setAction(ACTION_STOP);
        PendingIntent stopPending = PendingIntent.getService(
                this, 0, stopIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT);

        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle(getString(R.string.computer_use_session_title))
                .setContentText(getString(R.string.computer_use_session_text))
                .setSmallIcon(R.mipmap.ic_launcher)
                .setOngoing(true)
                .setCategory(NotificationCompat.CATEGORY_SERVICE)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .addAction(0, getString(R.string.computer_use_session_stop), stopPending)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }
    }

    private void stopSelfAndForeground() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(Service.STOP_FOREGROUND_REMOVE);
        } else {
            stopForeground(true);
        }
        stopSelf();
    }

    private void createChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null && nm.getNotificationChannel(CHANNEL_ID) == null) {
                NotificationChannel channel = new NotificationChannel(
                        CHANNEL_ID,
                        getString(R.string.computer_use_session_channel),
                        NotificationManager.IMPORTANCE_LOW);
                channel.setDescription(getString(R.string.computer_use_session_text));
                nm.createNotificationChannel(channel);
            }
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
