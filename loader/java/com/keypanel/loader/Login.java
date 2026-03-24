package com.keypanel.loader;

/*
 * KeyPanel Native Loader — Java companion class
 *
 * If your app uses a different package, move this file into your
 * package directory and update the package declaration above.
 * Then set -DJNI_CLASS_PATH="com/yourpkg/Login" at compile time
 * so the native side registers against the correct class.
 *
 * The native library name ("keypanel") must match LOCAL_MODULE
 * in Android.mk or the target name in CMakeLists.txt.
 */

import android.content.Context;

public class Login {

    static {
        System.loadLibrary("keypanel");
    }

    public static native String native_Check(Context context, String userKey);

    public static String check(Context context, String userKey) {
        if (context == null) return "ERROR: null context";
        if (userKey == null || userKey.isEmpty()) return "ERROR: empty key";
        return native_Check(context, userKey);
    }

    public static boolean isOk(String result) {
        return "OK".equals(result);
    }
}
