package com.acedatacloud.nexior;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;

import androidx.annotation.NonNull;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor bridge for Android Computer Use — the JS side calls these methods
 * (via the `window.localExec`-shaped adapter) to drive the screen, exactly like
 * the desktop `window.localExec.invoke('computer.click', …)` path. The heavy
 * lifting lives in {@link ComputerUseAccessibilityService}; this class only
 * marshals args/results and gates every action on the service being enabled.
 *
 * NOTE: this capability is deliberately NOT shipped in the Play Store build.
 * A Gradle `play`/`full` flavor split keeps it out of the Play flavor; only the
 * download-page sideload APK registers the accessibility service. (See the plan
 * doc plans/nexior-desktop/COMPUTER-USE-ANDROID.md.)
 */
@CapacitorPlugin(name = "ComputerUse")
public class ComputerUsePlugin extends Plugin {

    /** Whether our accessibility service is enabled in system settings. */
    private boolean isAccessibilityEnabled() {
        Context ctx = getContext();
        String enabled = Settings.Secure.getString(
                ctx.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        if (TextUtils.isEmpty(enabled)) {
            return false;
        }
        ComponentName expected = new ComponentName(ctx, ComputerUseAccessibilityService.class);
        String flat = expected.flattenToString();
        for (String part : enabled.split(":")) {
            if (part.equalsIgnoreCase(flat)) {
                return true;
            }
        }
        return false;
    }

    @PluginMethod
    public void status(PluginCall call) {
        boolean a11y = isAccessibilityEnabled() && ComputerUseAccessibilityService.isRunning();
        boolean canScreenshot = Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && a11y;
        JSObject ret = new JSObject();
        ret.put("accessibility", a11y);
        ret.put("canScreenshot", canScreenshot);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        getContext().startActivity(intent);
        call.resolve();
    }

    private ComputerUseAccessibilityService requireService(PluginCall call) {
        ComputerUseAccessibilityService svc = ComputerUseAccessibilityService.getInstance();
        if (svc == null) {
            call.reject("accessibility service not enabled");
        }
        return svc;
    }

    @PluginMethod
    public void screenshot(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
            call.reject("screenshot requires Android 11+");
            return;
        }
        ComputerUseAccessibilityService svc = requireService(call);
        if (svc == null) return;
        svc.screenshot((base64Jpeg, width, height, error) -> {
            if (error != null || base64Jpeg == null) {
                call.reject(error != null ? error : "screenshot failed");
                return;
            }
            JSObject ret = new JSObject();
            ret.put("image", base64Jpeg);
            ret.put("width", width);
            ret.put("height", height);
            call.resolve(ret);
        });
    }

    @PluginMethod
    public void click(PluginCall call) {
        ComputerUseAccessibilityService svc = requireService(call);
        if (svc == null) return;
        Double x = call.getDouble("x");
        Double y = call.getDouble("y");
        if (x == null || y == null) {
            call.reject("click requires x and y");
            return;
        }
        svc.click(x.floatValue(), y.floatValue(), (ok, err) -> resolveOk(call, ok, err));
    }

    @PluginMethod
    public void move(PluginCall call) {
        // Android has no system-level hover pointer; treat move as a no-op so the
        // agent loop doesn't stall. (Documented in the plan.)
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("note", "move is a no-op on Android (no hover pointer)");
        call.resolve(ret);
    }

    @PluginMethod
    public void scroll(PluginCall call) {
        ComputerUseAccessibilityService svc = requireService(call);
        if (svc == null) return;
        Double x = call.getDouble("x", 0.0);
        Double y = call.getDouble("y", 0.0);
        Double sx = call.getDouble("scrollX", 0.0);
        Double sy = call.getDouble("scrollY", 0.0);
        svc.scroll(x.floatValue(), y.floatValue(), sx.floatValue(), sy.floatValue(),
                (ok, err) -> resolveOk(call, ok, err));
    }

    @PluginMethod
    public void type(PluginCall call) {
        ComputerUseAccessibilityService svc = requireService(call);
        if (svc == null) return;
        String text = call.getString("text");
        if (text == null) {
            call.reject("type requires text");
            return;
        }
        boolean ok = svc.type(text);
        resolveOk(call, ok, ok ? null : "no focused editable field to type into");
    }

    @PluginMethod
    public void key(PluginCall call) {
        ComputerUseAccessibilityService svc = requireService(call);
        if (svc == null) return;
        var arr = call.getArray("keys");
        String name = null;
        try {
            if (arr != null && arr.length() > 0) {
                name = arr.getString(0);
            }
        } catch (org.json.JSONException ignored) {
        }
        if (name == null) {
            call.reject("key requires a keys array, e.g. [\"back\"]");
            return;
        }
        boolean ok = svc.key(name);
        resolveOk(call, ok, ok ? null : "unsupported key: " + name);
    }

    private void resolveOk(@NonNull PluginCall call, boolean ok, String err) {
        if (!ok) {
            call.reject(err != null ? err : "action failed");
            return;
        }
        JSObject ret = new JSObject();
        ret.put("ok", true);
        call.resolve(ret);
    }
}
