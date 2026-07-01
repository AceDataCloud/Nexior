package com.acedatacloud.nexior;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Bitmap;
import android.graphics.Path;
import android.hardware.HardwareBuffer;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.Display;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.annotation.RequiresApi;

import java.io.ByteArrayOutputStream;

/**
 * The accessibility service that actually performs Computer-Use actions on the
 * device — it is the Android analogue of the desktop `electron/local/computer.ts`
 * (nut.js + desktopCapturer). It is only active while the user has explicitly
 * enabled "AceData Computer Use" in Settings → Accessibility; until then every
 * {@link ComputerUsePlugin} call rejects, so the model can never silently act.
 *
 * Capability comes from three system APIs:
 *   - {@link #dispatchGesture} → tap / swipe / drag  (click, scroll)
 *   - {@link #performGlobalAction} → Back / Home / Recents / Notifications (key)
 *   - {@link #takeScreenshot} (API 30+) → the screen pixels the model "sees"
 *   - a focused editable node's ACTION_SET_TEXT → type
 *
 * Coordinates are raw screen pixels: the screenshot we return and the gestures
 * we dispatch live in the same pixel space, so a coordinate the model reads off
 * the image maps 1:1 to where we tap (no density math).
 */
public class ComputerUseAccessibilityService extends AccessibilityService {

    /** Set/cleared on (dis)connect so the plugin can reach the running service. */
    @Nullable
    private static ComputerUseAccessibilityService instance;

    @Nullable
    public static ComputerUseAccessibilityService getInstance() {
        return instance;
    }

    public static boolean isRunning() {
        return instance != null;
    }

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        instance = this;
    }

    @Override
    public boolean onUnbind(android.content.Intent intent) {
        instance = null;
        return super.onUnbind(intent);
    }

    @Override
    public void onDestroy() {
        instance = null;
        super.onDestroy();
    }

    // AccessibilityService requires these overrides; we don't consume events —
    // we only drive the screen imperatively from the plugin.
    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {}

    @Override
    public void onInterrupt() {}

    // ---- Actions ------------------------------------------------------------

    /** Callback for imperative actions (dispatchGesture / screenshot are async). */
    public interface ActionCallback {
        void onResult(boolean ok, @Nullable String error);
    }

    public interface ScreenshotCallback {
        void onResult(@Nullable String base64Jpeg, int width, int height, @Nullable String error);
    }

    /** Single tap at raw pixel (x, y). */
    public void click(float x, float y, @NonNull ActionCallback cb) {
        Path path = new Path();
        path.moveTo(x, y);
        GestureDescription gesture = new GestureDescription.Builder()
                .addStroke(new GestureDescription.StrokeDescription(path, 0, 60))
                .build();
        dispatch(gesture, cb);
    }

    /** Swipe from (x, y) by (scrollX, scrollY) raw pixels. Positive scrollY scrolls the CONTENT up (finger moves up). */
    public void scroll(float x, float y, float scrollX, float scrollY, @NonNull ActionCallback cb) {
        Path path = new Path();
        path.moveTo(x, y);
        // A finger drag opposite to the desired content movement; keep it simple
        // and 1:1 with the requested delta.
        path.lineTo(x - scrollX, y - scrollY);
        GestureDescription gesture = new GestureDescription.Builder()
                .addStroke(new GestureDescription.StrokeDescription(path, 0, 300))
                .build();
        dispatch(gesture, cb);
    }

    private void dispatch(GestureDescription gesture, @NonNull ActionCallback cb) {
        boolean queued = dispatchGesture(gesture, new GestureResultCallback() {
            @Override
            public void onCompleted(GestureDescription g) {
                cb.onResult(true, null);
            }

            @Override
            public void onCancelled(GestureDescription g) {
                cb.onResult(false, "gesture cancelled");
            }
        }, null);
        if (!queued) {
            cb.onResult(false, "gesture could not be dispatched");
        }
    }

    /** Map a logical key name to a global action; returns false for unsupported keys. */
    public boolean key(@NonNull String name) {
        int action;
        switch (name.toLowerCase()) {
            case "back":
                action = GLOBAL_ACTION_BACK;
                break;
            case "home":
                action = GLOBAL_ACTION_HOME;
                break;
            case "recents":
            case "apps":
                action = GLOBAL_ACTION_RECENTS;
                break;
            case "notifications":
                action = GLOBAL_ACTION_NOTIFICATIONS;
                break;
            default:
                return false;
        }
        return performGlobalAction(action);
    }

    /** Set text on the currently focused editable node (best-effort). */
    public boolean type(@NonNull String text) {
        AccessibilityNodeInfo focused = findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (focused == null) {
            return false;
        }
        try {
            Bundle args = new Bundle();
            args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
            return focused.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
        } finally {
            focused.recycle();
        }
    }

    /** Capture the primary display and return a `data:image/jpeg;base64,…` string. */
    @RequiresApi(api = Build.VERSION_CODES.R)
    public void screenshot(@NonNull ScreenshotCallback cb) {
        takeScreenshot(Display.DEFAULT_DISPLAY, getMainExecutor(), new TakeScreenshotCallback() {
            @Override
            public void onSuccess(@NonNull ScreenshotResult result) {
                HardwareBuffer buffer = null;
                Bitmap bitmap = null;
                try {
                    buffer = result.getHardwareBuffer();
                    bitmap = Bitmap.wrapHardwareBuffer(buffer, result.getColorSpace());
                    if (bitmap == null) {
                        cb.onResult(null, 0, 0, "failed to wrap screenshot buffer");
                        return;
                    }
                    // Copy off the hardware buffer so we can compress (and so the
                    // buffer can be released immediately).
                    Bitmap software = bitmap.copy(Bitmap.Config.ARGB_8888, false);
                    ByteArrayOutputStream out = new ByteArrayOutputStream();
                    // Quality 60 keeps a full-screen shot well under the tool-result
                    // image budget while staying legible; dims stay 1:1 with taps.
                    software.compress(Bitmap.CompressFormat.JPEG, 60, out);
                    String b64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
                    cb.onResult("data:image/jpeg;base64," + b64, software.getWidth(), software.getHeight(), null);
                    software.recycle();
                } catch (Exception e) {
                    cb.onResult(null, 0, 0, "screenshot encode failed: " + e.getMessage());
                } finally {
                    if (bitmap != null) bitmap.recycle();
                    if (buffer != null) buffer.close();
                }
            }

            @Override
            public void onFailure(int errorCode) {
                cb.onResult(null, 0, 0, "takeScreenshot failed: code " + errorCode);
            }
        });
    }
}
