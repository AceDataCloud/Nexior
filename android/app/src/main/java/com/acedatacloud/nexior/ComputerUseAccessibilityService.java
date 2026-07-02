package com.acedatacloud.nexior;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.graphics.Bitmap;
import android.graphics.Path;
import android.graphics.Rect;
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

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayDeque;

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

    /**
     * Authoritative kill switch. Set true synchronously when the user taps Stop
     * on the session notification, BEFORE the JS layer is even notified, so
     * every subsequent action rejects at the native layer regardless of what
     * the WebView loop does (no TOCTOU, no dependence on the JS broadcast being
     * delivered). Cleared only when the user re-arms Computer Use. `volatile`
     * because it is read/written from the gesture thread and the service thread.
     */
    private static volatile boolean sessionStopped = false;

    public static void setSessionStopped(boolean stopped) {
        sessionStopped = stopped;
    }

    public static boolean isSessionStopped() {
        return sessionStopped;
    }

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

    // ---- Semantic UI tree (node-based targeting) ----------------------------

    /**
     * Snapshot the CURRENT foreground window's accessibility tree as a compact
     * JSON array of actionable elements — the semantic alternative to guessing
     * pixel coordinates off a screenshot. Each element carries its visible
     * label, a short class name, and the raw-pixel CENTER of its bounds so the
     * model can tap it precisely (via {@link #tapText} or computer.click).
     * Capped at 60 elements to stay small in the model's context.
     *
     * Every traversed node is recycled (via per-iteration finally + a final
     * drain) so repeated dumps don't exhaust the AccessibilityNodeInfo pool on
     * API < 33 (recycle() is a harmless no-op on newer releases).
     */
    @NonNull
    public String dumpUi() {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        JSONArray arr = new JSONArray();
        if (root == null) {
            return arr.toString();
        }
        ArrayDeque<AccessibilityNodeInfo> stack = new ArrayDeque<>();
        stack.push(root);
        int idx = 0;
        try {
            while (!stack.isEmpty() && idx < 60) {
                AccessibilityNodeInfo n = stack.pop();
                if (n == null) {
                    continue;
                }
                try {
                    for (int i = n.getChildCount() - 1; i >= 0; i--) {
                        AccessibilityNodeInfo c = n.getChild(i);
                        if (c != null) {
                            stack.push(c);
                        }
                    }
                    if (!n.isVisibleToUser()) {
                        continue;
                    }
                    CharSequence t = n.getText();
                    CharSequence d = n.getContentDescription();
                    String label = t != null ? t.toString() : (d != null ? d.toString() : "");
                    boolean actionable = n.isClickable() || n.isEditable() || n.isCheckable() || n.isLongClickable();
                    if (label.trim().isEmpty() && !actionable) {
                        continue;
                    }
                    if (label.length() > 80) {
                        label = label.substring(0, 80);
                    }
                    Rect r = new Rect();
                    n.getBoundsInScreen(r);
                    if (r.width() <= 0 || r.height() <= 0) {
                        continue;
                    }
                    JSONObject o = new JSONObject();
                    o.put("i", idx);
                    o.put("label", label);
                    CharSequence clsSeq = n.getClassName();
                    String cls = clsSeq != null ? clsSeq.toString() : "";
                    int dot = cls.lastIndexOf('.');
                    o.put("cls", dot >= 0 ? cls.substring(dot + 1) : cls);
                    o.put("x", r.centerX());
                    o.put("y", r.centerY());
                    o.put("click", n.isClickable());
                    o.put("edit", n.isEditable());
                    arr.put(o);
                    idx++;
                } catch (JSONException ignored) {
                    // skip a node we can't serialize rather than fail the whole dump
                } finally {
                    n.recycle();
                }
            }
        } finally {
            for (AccessibilityNodeInfo rem : stack) {
                if (rem != null) {
                    rem.recycle();
                }
            }
        }
        return arr.toString();
    }

    /**
     * Tap a node by its visible text / content-description. Prefers an exact
     * (case-insensitive) label match, else the first "contains" match, then
     * performs ACTION_CLICK on the nearest clickable self-or-ancestor (more
     * reliable than a blind gesture); falls back to a gesture tap at the node's
     * center if nothing in the chain is directly clickable.
     *
     * All traversed / climbed nodes are recycled before returning; the gesture
     * fallback extracts the center coordinates FIRST so no live node is needed
     * across the async dispatch.
     */
    public void tapText(@NonNull String query, @NonNull ActionCallback cb) {
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) {
            cb.onResult(false, "no active window to inspect");
            return;
        }
        String q = query.trim().toLowerCase();
        ArrayDeque<AccessibilityNodeInfo> stack = new ArrayDeque<>();
        stack.push(root);
        // Nodes we own and must recycle. `target` is pulled OUT of this list so
        // it survives the climb; everything else is recycled in finally.
        java.util.ArrayList<AccessibilityNodeInfo> owned = new java.util.ArrayList<>();
        AccessibilityNodeInfo target = null;
        AccessibilityNodeInfo containsMatch = null;
        int visited = 0;
        boolean clicked = false;
        String err = null;
        Rect bounds = new Rect();
        try {
            while (!stack.isEmpty() && visited < 800 && target == null) {
                AccessibilityNodeInfo n = stack.pop();
                if (n == null) {
                    continue;
                }
                visited++;
                owned.add(n);
                for (int i = n.getChildCount() - 1; i >= 0; i--) {
                    AccessibilityNodeInfo c = n.getChild(i);
                    if (c != null) {
                        stack.push(c);
                    }
                }
                if (!n.isVisibleToUser()) {
                    continue;
                }
                CharSequence t = n.getText();
                CharSequence d = n.getContentDescription();
                String label = (t != null ? t.toString() : (d != null ? d.toString() : "")).trim().toLowerCase();
                if (label.isEmpty()) {
                    continue;
                }
                if (label.equals(q)) {
                    target = n;
                } else if (containsMatch == null && label.contains(q)) {
                    containsMatch = n;
                }
            }
            if (target == null) {
                target = containsMatch;
            }
            if (target == null) {
                err = "no on-screen element matching \"" + query + "\"";
            } else {
                owned.remove(target); // keep it alive past the finally-recycle
                target.getBoundsInScreen(bounds);
                AccessibilityNodeInfo cur = target;
                int guard = 0;
                while (cur != null && guard++ < 25) {
                    if (cur.isClickable()) {
                        clicked = cur.performAction(AccessibilityNodeInfo.ACTION_CLICK);
                        break;
                    }
                    AccessibilityNodeInfo parent = cur.getParent();
                    if (cur != target) {
                        cur.recycle();
                    }
                    cur = parent;
                }
                if (cur != null && cur != target) {
                    cur.recycle();
                }
            }
        } finally {
            for (AccessibilityNodeInfo o : owned) {
                if (o != null) {
                    o.recycle();
                }
            }
            for (AccessibilityNodeInfo rem : stack) {
                if (rem != null) {
                    rem.recycle();
                }
            }
        }
        if (clicked) {
            if (target != null) target.recycle();
            cb.onResult(true, null);
            return;
        }
        if (target == null) {
            cb.onResult(false, err);
            return;
        }
        // Gesture fallback: coordinates are already captured, so recycle first.
        boolean hasBounds = bounds.width() > 0 && bounds.height() > 0;
        float cx = bounds.exactCenterX();
        float cy = bounds.exactCenterY();
        target.recycle();
        if (!hasBounds) {
            cb.onResult(false, "matched element has no tappable bounds");
            return;
        }
        click(cx, cy, cb);
    }
}
