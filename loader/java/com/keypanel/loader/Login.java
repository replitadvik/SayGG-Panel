package com.keypanel.loader;

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
