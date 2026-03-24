#pragma once

/*
 * ============================================================
 *  PRODUCTION CONFIGURATION — set these via build system
 *  (CMake -D flags, Android.mk variables, or local.properties)
 *
 *  Do NOT commit real secrets into source control.
 * ============================================================
 */

#ifndef ENDPOINT_URL
#define ENDPOINT_URL "https://yourdomain.com/connect"
#endif

#ifndef GAME_NAME
#define GAME_NAME "PUBG"
#endif

#ifndef LICENSE_SECRET
#define LICENSE_SECRET "REPLACE_WITH_YOUR_SECRET"
#endif

#ifndef RNG_WINDOW_SEC
#define RNG_WINDOW_SEC 30
#endif

/* Optional: define PINNED_PUBLIC_KEY as a sha256 hash for TLS pinning.
 * Example: "sha256//YhKJG3Wl3Hxyz...="
 * If not defined, standard CA verification is still enforced. */

/*
 * ============================================================
 *  JNI PACKAGE BINDING
 *
 *  The default JNI function name below maps to:
 *      package: com.keypanel.loader
 *      class:   Login
 *      method:  native_Check
 *
 *  If your app uses a different package, you MUST either:
 *    1. Rename the extern "C" function in Login.cpp, or
 *    2. Use RegisterNatives in JNI_OnLoad (see bottom of Login.cpp)
 *
 *  The Java-side class must match. See loader/java/ for the
 *  companion Login.java.
 * ============================================================
 */

#ifndef JNI_PACKAGE_PATH
#define JNI_PACKAGE_PATH com_keypanel_loader
#endif

#include <jni.h>
#include <string>

struct ConnectResponse {
    bool        status;
    std::string reason;

    std::string token;
    int         secret_version;
    std::string modname;
    std::string mod_status;
    std::string credit;

    std::string ESP;
    std::string Item;
    std::string AIM;
    std::string SilentAim;
    std::string BulletTrack;
    std::string Floating;
    std::string Memory;
    std::string Setting;

    std::string EXP;
    int         device;
    long long   rng;

    std::string game;
    std::string gameDisplayName;
    std::string keyStatus;
    std::string durationLabel;
    std::string expiresAt;
    long long   timeLeftMs;
    std::string timeLeft;
    int         maxDevices;
    int         usedDevices;
};

std::string Login_GetAndroidId(JNIEnv* env, jobject context);
std::string Login_GetDeviceModel();
std::string Login_GetDeviceBrand();

std::string Login_BuildSerial(JNIEnv* env, jobject context, const std::string& userKey);

std::string Login_MD5(const std::string& input);
std::string Login_NameUUID(const std::string& input);

bool Login_HttpPost(const std::string& url, const std::string& body,
                    std::string& responseOut);
bool Login_Connect(const std::string& userKey, const std::string& serial,
                   ConnectResponse& out);
bool Login_VerifyToken(const std::string& game, const std::string& userKey,
                       const std::string& serial, const std::string& token);

#ifdef __cplusplus
extern "C" {
#endif

JNIEXPORT jstring JNICALL
Java_com_keypanel_loader_Login_native_1Check(JNIEnv* env, jclass clazz,
                                             jobject context, jstring userKey);

#ifdef __cplusplus
}
#endif
