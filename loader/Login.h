#pragma once

/* ============================================================
 *  KeyPanel Android Native Loader — Configuration
 * ============================================================
 *
 *  SET THESE VIA YOUR BUILD SYSTEM before compiling.
 *  Do NOT commit real values into source control.
 *
 *  CMake example (app/build.gradle):
 *    externalNativeBuild {
 *        cmake {
 *            arguments "-DKEYPANEL_ENDPOINT=https://yourserver.com/connect",
 *                      "-DKEYPANEL_GAME=PUBG",
 *                      "-DKEYPANEL_SECRET=your-production-secret"
 *        }
 *    }
 *
 *  ndk-build example (Android.mk):
 *    LOCAL_CPPFLAGS += -DENDPOINT_URL=\"https://yourserver.com/connect\"
 *    LOCAL_CPPFLAGS += -DGAME_NAME=\"PUBG\"
 *    LOCAL_CPPFLAGS += -DLICENSE_SECRET=\"your-production-secret\"
 *
 *  For per-game builds, change only GAME_NAME:
 *    PUBG build:  -DGAME_NAME=\"PUBG\"
 *    BGMI build:  -DGAME_NAME=\"BGMI\"
 *    Custom:      -DGAME_NAME=\"YourGame\"
 *  The game name must match a game.name entry in the backend
 *  games table. Everything else stays the same.
 * ============================================================ */

#ifndef ENDPOINT_URL
#error "ENDPOINT_URL must be defined at compile time (e.g. -DENDPOINT_URL=\"https://yourserver.com/connect\")"
#endif

#ifndef GAME_NAME
#error "GAME_NAME must be defined at compile time (e.g. -DGAME_NAME=\"PUBG\")"
#endif

#ifndef LICENSE_SECRET
#error "LICENSE_SECRET must be defined at compile time (e.g. -DLICENSE_SECRET=\"your-secret\")"
#endif

/* RNG_WINDOW_SEC: max age (in seconds) of the server timestamp.
 * Legacy default is 30. Increase only if network latency is extreme. */
#ifndef RNG_WINDOW_SEC
#define RNG_WINDOW_SEC 30
#endif

/* Optional TLS public key pinning.
 * Define as a sha256 base64 hash to enable CURLOPT_PINNEDPUBLICKEY.
 * Example: -DPINNED_PUBLIC_KEY=\"sha256//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=\"
 * If not defined, standard CA chain verification is still enforced. */

/* ============================================================
 *  JNI CLASS BINDING
 *
 *  JNI_CLASS_PATH controls which Java class the native method
 *  is registered against at runtime via RegisterNatives.
 *
 *  Default: "com/keypanel/loader/Login"
 *
 *  To integrate into a different app package, set this macro
 *  to your actual class path at compile time:
 *    -DJNI_CLASS_PATH=\"com/myapp/security/NativeAuth\"
 *
 *  The Java class must declare:
 *    static native String native_Check(Context ctx, String key);
 * ============================================================ */
#ifndef JNI_CLASS_PATH
#define JNI_CLASS_PATH "com/keypanel/loader/Login"
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

jstring KeyPanel_NativeCheck(JNIEnv* env, jclass clazz,
                             jobject context, jstring userKey);
