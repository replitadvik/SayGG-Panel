#include "Login.h"

#include <cstdio>
#include <cstring>
#include <cstdlib>
#include <ctime>
#include <sstream>
#include <iomanip>
#include <vector>

#include <jni.h>
#include <android/log.h>
#include <sys/system_properties.h>
#include <curl/curl.h>
#include <openssl/md5.h>

#include "json.hpp"

#define LOG_TAG "KeyPanel"
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

/* ================================================================
 *  JNI string helper
 * ================================================================ */

static std::string jstring_to_string(JNIEnv* env, jstring jstr) {
    if (!jstr) return "";
    const char* raw = env->GetStringUTFChars(jstr, nullptr);
    if (!raw) return "";
    std::string result(raw);
    env->ReleaseStringUTFChars(jstr, raw);
    return result;
}

static std::string get_system_property(const char* prop) {
    char buf[256] = {0};
    __system_property_get(prop, buf);
    return std::string(buf);
}

/* ================================================================
 *  Device info helpers
 * ================================================================ */

std::string Login_GetAndroidId(JNIEnv* env, jobject context) {
    jclass settingsSecure = env->FindClass("android/provider/Settings$Secure");
    if (!settingsSecure) return "";

    jmethodID getString = env->GetStaticMethodID(settingsSecure, "getString",
        "(Landroid/content/ContentResolver;Ljava/lang/String;)Ljava/lang/String;");
    if (!getString) return "";

    jclass ctxClass = env->GetObjectClass(context);
    jmethodID getContentResolver = env->GetMethodID(ctxClass, "getContentResolver",
        "()Landroid/content/ContentResolver;");
    if (!getContentResolver) return "";

    jobject resolver = env->CallObjectMethod(context, getContentResolver);
    if (!resolver) return "";

    jstring fieldName = env->NewStringUTF("android_id");
    jstring jResult = (jstring)env->CallStaticObjectMethod(settingsSecure,
                                                            getString, resolver, fieldName);

    std::string result = jstring_to_string(env, jResult);

    env->DeleteLocalRef(fieldName);
    if (jResult) env->DeleteLocalRef(jResult);
    env->DeleteLocalRef(resolver);

    return result;
}

std::string Login_GetDeviceModel() {
    return get_system_property("ro.product.model");
}

std::string Login_GetDeviceBrand() {
    return get_system_property("ro.product.brand");
}

/* ================================================================
 *  MD5 utility
 * ================================================================ */

std::string Login_MD5(const std::string& input) {
    unsigned char digest[MD5_DIGEST_LENGTH];
    MD5(reinterpret_cast<const unsigned char*>(input.c_str()),
        input.size(), digest);

    std::ostringstream ss;
    for (int i = 0; i < MD5_DIGEST_LENGTH; ++i)
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)digest[i];
    return ss.str();
}

/* ================================================================
 *  UUID.nameUUIDFromBytes — Java-compatible UUID v3
 *
 *  Replicates Java's UUID.nameUUIDFromBytes(byte[]) exactly:
 *    1. MD5 hash the input bytes
 *    2. digest[6] = (digest[6] & 0x0f) | 0x30  (version 3)
 *    3. digest[8] = (digest[8] & 0x3f) | 0x80  (IETF variant)
 *    4. Format as lowercase 8-4-4-4-12 with dashes
 * ================================================================ */

std::string Login_NameUUID(const std::string& input) {
    unsigned char digest[MD5_DIGEST_LENGTH];
    MD5(reinterpret_cast<const unsigned char*>(input.data()),
        input.size(), digest);

    digest[6] = (digest[6] & 0x0f) | 0x30;
    digest[8] = (digest[8] & 0x3f) | 0x80;

    char buf[37];
    snprintf(buf, sizeof(buf),
             "%02x%02x%02x%02x-%02x%02x-%02x%02x-%02x%02x-%02x%02x%02x%02x%02x%02x",
             digest[0],  digest[1],  digest[2],  digest[3],
             digest[4],  digest[5],
             digest[6],  digest[7],
             digest[8],  digest[9],
             digest[10], digest[11], digest[12], digest[13],
             digest[14], digest[15]);

    return std::string(buf);
}

/* ================================================================
 *  Serial generation — LEGACY COMPATIBLE
 *
 *  Legacy Java loader:
 *    String hwid = user_key + androidId + deviceModel + deviceBrand;
 *    String serial = UUID.nameUUIDFromBytes(hwid.getBytes()).toString();
 *
 *  Concatenation has NO separators — matches Java string concat.
 * ================================================================ */

std::string Login_BuildSerial(JNIEnv* env, jobject context, const std::string& userKey) {
    std::string androidId = Login_GetAndroidId(env, context);
    std::string model     = Login_GetDeviceModel();
    std::string brand     = Login_GetDeviceBrand();

    std::string hwid = userKey + androidId + model + brand;
    return Login_NameUUID(hwid);
}

/* ================================================================
 *  URL encoding
 * ================================================================ */

static std::string url_encode(const std::string& value) {
    std::ostringstream escaped;
    escaped << std::hex << std::setfill('0');
    for (unsigned char c : value) {
        if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
            escaped << c;
        } else {
            escaped << '%' << std::setw(2) << (int)c;
        }
    }
    return escaped.str();
}

/* ================================================================
 *  HTTP POST via libcurl
 * ================================================================ */

struct CurlWriteData {
    std::string body;
};

static size_t curl_write_cb(char* ptr, size_t size, size_t nmemb, void* userdata) {
    size_t total = size * nmemb;
    static_cast<CurlWriteData*>(userdata)->body.append(ptr, total);
    return total;
}

bool Login_HttpPost(const std::string& url, const std::string& body,
                    std::string& responseOut) {
    CURL* curl = curl_easy_init();
    if (!curl) {
        LOGE("init failed");
        responseOut = "NETWORK_ERROR";
        return false;
    }

    CurlWriteData wd;

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDSIZE, (long)body.size());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_cb);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &wd);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 15L);
    curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 10L);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 0L);
    curl_easy_setopt(curl, CURLOPT_USERAGENT, "KeyPanel-Loader/2.0");

    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L);

#ifdef PINNED_PUBLIC_KEY
    curl_easy_setopt(curl, CURLOPT_PINNEDPUBLICKEY, PINNED_PUBLIC_KEY);
#endif

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Accept: application/json");
    headers = curl_slist_append(headers, "Content-Type: application/x-www-form-urlencoded; charset=UTF-8");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    CURLcode res = curl_easy_perform(curl);

    long httpCode = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

    LOGD("HTTP status: %ld", httpCode);
    LOGD("raw response: %.512s", wd.body.c_str());

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        if (res == CURLE_SSL_CONNECT_ERROR || res == CURLE_SSL_CERTPROBLEM ||
            res == CURLE_SSL_CIPHER || res == CURLE_SSL_CACERT ||
            res == CURLE_SSL_PINNEDPUBKEYNOTMATCH) {
            LOGE("TLS error: %s", curl_easy_strerror(res));
            responseOut = "TLS_ERROR";
        } else if (res == CURLE_COULDNT_CONNECT || res == CURLE_COULDNT_RESOLVE_HOST) {
            LOGE("network error: %s", curl_easy_strerror(res));
            responseOut = "NETWORK_ERROR";
        } else if (res == CURLE_OPERATION_TIMEDOUT) {
            LOGE("request timeout");
            responseOut = "TIMEOUT";
        } else {
            LOGE("curl error %d: %s", (int)res, curl_easy_strerror(res));
            responseOut = "NETWORK_ERROR";
        }
        return false;
    }

    if (httpCode < 200 || httpCode >= 300) {
        LOGE("HTTP error %ld, body: %.256s", httpCode, wd.body.c_str());
        char codeBuf[32];
        snprintf(codeBuf, sizeof(codeBuf), "HTTP_%ld", httpCode);
        responseOut = codeBuf;
        return false;
    }

    responseOut = wd.body;
    return true;
}

/* ================================================================
 *  RNG auto-detection helper
 *
 *  The backend may send rng as:
 *    - seconds  (Unix epoch, ~10 digits, e.g. 1711234567)
 *    - milliseconds (Date.now(), ~13 digits, e.g. 1711234567890)
 *
 *  Auto-detect: if rng > 9999999999 (10^10), it is milliseconds.
 *  Otherwise treat as seconds.
 *
 *  After normalising to seconds, apply the legacy check:
 *    if (rng_sec + RNG_WINDOW_SEC > now_sec)
 * ================================================================ */

static long long rng_to_seconds(long long rng) {
    if (rng > 9999999999LL) {
        return rng / 1000LL;
    }
    return rng;
}

/* ================================================================
 *  /connect — POST, parse JSON, validate token + rng
 * ================================================================ */

bool Login_Connect(const std::string& userKey, const std::string& serial,
                   ConnectResponse& out) {
    std::string postBody = "game=" + url_encode(GAME_NAME)
                         + "&user_key=" + url_encode(userKey)
                         + "&serial=" + url_encode(serial);

    std::string rawResponse;
    if (!Login_HttpPost(ENDPOINT_URL, postBody, rawResponse)) {
        out.status = false;
        out.reason = rawResponse;
        return false;
    }

    /* Guard: response must begin with '{' to be valid JSON object.
     * If the server returned plain text or an HTML error page,
     * fail cleanly instead of crashing inside json::parse. */
    if (rawResponse.empty() || rawResponse[0] != '{') {
        LOGE("non-JSON response: %.256s", rawResponse.c_str());
        out.status = false;
        out.reason = "INVALID_RESPONSE";
        return false;
    }

    nlohmann::json root;
    try {
        root = nlohmann::json::parse(rawResponse);
    } catch (const std::exception& e) {
        LOGE("JSON parse error: %s | body: %.256s", e.what(), rawResponse.c_str());
        out.status = false;
        out.reason = "INVALID_RESPONSE";
        return false;
    }

    out.status = root.value("status", false);

    if (!out.status) {
        out.reason = root.value("reason", std::string("UNKNOWN_ERROR"));
        return false;
    }

    if (!root.contains("data") || !root["data"].is_object()) {
        out.status = false;
        out.reason = "MISSING_DATA";
        return false;
    }

    const auto& d = root["data"];

    out.token          = d.value("token",          std::string(""));
    out.secret_version = d.value("secret_version", 1);
    out.modname        = d.value("modname",        std::string(""));
    out.mod_status     = d.value("mod_status",     std::string(""));
    out.credit         = d.value("credit",         std::string(""));

    out.ESP            = d.value("ESP",            std::string("off"));
    out.Item           = d.value("Item",           std::string("off"));
    out.AIM            = d.value("AIM",            std::string("off"));
    out.SilentAim      = d.value("SilentAim",      std::string("off"));
    out.BulletTrack    = d.value("BulletTrack",    std::string("off"));
    out.Floating       = d.value("Floating",       std::string("off"));
    out.Memory         = d.value("Memory",         std::string("off"));
    out.Setting        = d.value("Setting",        std::string("off"));

    out.EXP            = d.value("EXP",            std::string(""));
    out.device         = d.value("device",         0);
    out.rng            = d.value("rng",            (long long)0);

    out.game            = d.value("game",            std::string(""));
    out.gameDisplayName = d.value("gameDisplayName", std::string(""));
    out.keyStatus       = d.value("keyStatus",       std::string(""));
    out.durationLabel   = d.value("durationLabel",   std::string(""));
    out.expiresAt       = d.value("expiresAt",       std::string(""));
    out.timeLeftMs      = d.value("timeLeftMs",      (long long)0);
    out.timeLeft        = d.value("timeLeft",        std::string(""));
    out.maxDevices      = d.value("maxDevices",      0);
    out.usedDevices     = d.value("usedDevices",     0);

    if (out.token.empty()) {
        out.status = false;
        out.reason = "MISSING_TOKEN";
        return false;
    }
    if (out.rng == 0) {
        out.status = false;
        out.reason = "MISSING_RNG";
        return false;
    }
    if (out.EXP.empty()) {
        out.status = false;
        out.reason = "MISSING_EXP";
        return false;
    }

    /* RNG validation — legacy compatible with auto-detection */
    long long rng_sec = rng_to_seconds(out.rng);
    long long now_sec = (long long)time(nullptr);

    if (!(rng_sec + RNG_WINDOW_SEC > now_sec)) {
        LOGE("rng expired: server=%lld device=%lld", rng_sec, now_sec);
        out.status = false;
        out.reason = "RNG_EXPIRED";
        return false;
    }

    /* Token verification */
    if (!Login_VerifyToken(GAME_NAME, userKey, serial, out.token)) {
        out.status = false;
        out.reason = "TOKEN_MISMATCH";
        return false;
    }

    return true;
}

/* ================================================================
 *  Token verification
 *  md5("{game}-{user_key}-{serial}-{license_secret}")
 * ================================================================ */

bool Login_VerifyToken(const std::string& game, const std::string& userKey,
                       const std::string& serial, const std::string& token) {
    std::string raw = game + "-" + userKey + "-" + serial + "-" + LICENSE_SECRET;
    std::string expected = Login_MD5(raw);
    return expected == token;
}

/* ================================================================
 *  Native check implementation
 *
 *  Called from JNI via RegisterNatives (see JNI_OnLoad below).
 *  Also usable as a direct JNI export if needed.
 * ================================================================ */

jstring KeyPanel_NativeCheck(JNIEnv* env, jclass /*clazz*/,
                             jobject context, jstring jUserKey) {
    if (!context) {
        return env->NewStringUTF("ERROR: null context");
    }
    if (!jUserKey) {
        return env->NewStringUTF("ERROR: null key");
    }

    std::string userKey = jstring_to_string(env, jUserKey);
    if (userKey.empty()) {
        return env->NewStringUTF("ERROR: empty key");
    }

    std::string serial = Login_BuildSerial(env, context, userKey);
    if (serial.empty()) {
        return env->NewStringUTF("ERROR: device identity failed");
    }

    LOGD("connect: game=%s", GAME_NAME);

    ConnectResponse resp = {};
    Login_Connect(userKey, serial, resp);

    if (resp.status) {
        return env->NewStringUTF("OK");
    }

    std::string errMsg = resp.reason.empty() ? "AUTH_FAILED" : resp.reason;
    return env->NewStringUTF(errMsg.c_str());
}

/* ================================================================
 *  JNI_OnLoad — RegisterNatives approach
 *
 *  Registers KeyPanel_NativeCheck as the implementation of
 *  native_Check on the Java class specified by JNI_CLASS_PATH.
 *
 *  Default JNI_CLASS_PATH: "com/keypanel/loader/Login"
 *
 *  To use a different package/class, set at compile time:
 *    -DJNI_CLASS_PATH=\"com/myapp/auth/Loader\"
 *
 *  The Java class must declare:
 *    static native String native_Check(Context ctx, String key);
 * ================================================================ */

static JNINativeMethod gMethods[] = {
    {
        (char*)"native_Check",
        (char*)"(Landroid/content/Context;Ljava/lang/String;)Ljava/lang/String;",
        (void*)KeyPanel_NativeCheck
    }
};

extern "C"
JNIEXPORT jint JNI_OnLoad(JavaVM* vm, void* /*reserved*/) {
    JNIEnv* env = nullptr;
    if (vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) != JNI_OK) {
        return JNI_ERR;
    }

    jclass cls = env->FindClass(JNI_CLASS_PATH);
    if (!cls) {
        LOGE("JNI_OnLoad: class not found: %s", JNI_CLASS_PATH);
        return JNI_ERR;
    }

    int rc = env->RegisterNatives(cls, gMethods,
                                  sizeof(gMethods) / sizeof(gMethods[0]));
    if (rc != JNI_OK) {
        LOGE("JNI_OnLoad: RegisterNatives failed for %s", JNI_CLASS_PATH);
        return JNI_ERR;
    }

    LOGD("JNI_OnLoad: registered native_Check on %s", JNI_CLASS_PATH);
    return JNI_VERSION_1_6;
}
