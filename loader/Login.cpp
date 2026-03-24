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
    jstring jResult = (jstring)env->CallStaticObjectMethod(settingsSecure, getString, resolver, fieldName);

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

std::string Login_GetPackageName(JNIEnv* env, jobject context) {
    jclass ctxClass = env->GetObjectClass(context);
    jmethodID getPackageName = env->GetMethodID(ctxClass, "getPackageName", "()Ljava/lang/String;");
    if (!getPackageName) return "";

    jstring jPkg = (jstring)env->CallObjectMethod(context, getPackageName);
    std::string result = jstring_to_string(env, jPkg);
    if (jPkg) env->DeleteLocalRef(jPkg);
    return result;
}

std::string Login_BuildSerial(JNIEnv* env, jobject context) {
    std::string androidId = Login_GetAndroidId(env, context);
    std::string model     = Login_GetDeviceModel();
    std::string brand     = Login_GetDeviceBrand();
    std::string pkg       = Login_GetPackageName(env, context);

    std::string raw = androidId + "|" + brand + "|" + model + "|" + pkg;
    return Login_MD5(raw);
}

std::string Login_MD5(const std::string& input) {
    unsigned char digest[MD5_DIGEST_LENGTH];
    MD5(reinterpret_cast<const unsigned char*>(input.c_str()),
        input.size(), digest);

    std::ostringstream ss;
    for (int i = 0; i < MD5_DIGEST_LENGTH; ++i)
        ss << std::hex << std::setw(2) << std::setfill('0') << (int)digest[i];
    return ss.str();
}

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

struct CurlWriteData {
    std::string body;
};

static size_t curl_write_cb(char* ptr, size_t size, size_t nmemb, void* userdata) {
    size_t total = size * nmemb;
    static_cast<CurlWriteData*>(userdata)->body.append(ptr, total);
    return total;
}

bool Login_HttpPost(const std::string& url, const std::string& body, std::string& responseOut) {
    CURL* curl = curl_easy_init();
    if (!curl) {
        LOGE("curl_easy_init failed");
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
    headers = curl_slist_append(headers, "Content-Type: application/x-www-form-urlencoded");
    headers = curl_slist_append(headers, "Accept: application/json");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    CURLcode res = curl_easy_perform(curl);

    long httpCode = 0;
    curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &httpCode);

    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) {
        LOGE("curl error: %s", curl_easy_strerror(res));
        return false;
    }

    if (httpCode < 200 || httpCode >= 300) {
        LOGE("HTTP %ld", httpCode);
        return false;
    }

    responseOut = wd.body;
    return true;
}

bool Login_Connect(const std::string& userKey, const std::string& serial, ConnectResponse& out) {
    std::string postBody = "game=" + url_encode(GAME_NAME)
                         + "&user_key=" + url_encode(userKey)
                         + "&serial=" + url_encode(serial);

    std::string rawResponse;
    if (!Login_HttpPost(ENDPOINT_URL, postBody, rawResponse)) {
        out.status = false;
        out.reason = "CONNECTION_FAILED";
        return false;
    }

    nlohmann::json root;
    try {
        root = nlohmann::json::parse(rawResponse);
    } catch (const std::exception& e) {
        LOGE("JSON parse error: %s", e.what());
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

    long long now_ms = (long long)time(nullptr) * 1000LL;
    long long drift  = now_ms - out.rng;
    if (drift < 0) drift = -drift;
    if (drift > RNG_WINDOW_MS) {
        LOGE("rng drift %lld ms exceeds window %d", drift, RNG_WINDOW_MS);
        out.status = false;
        out.reason = "RNG_EXPIRED";
        return false;
    }

    if (!Login_VerifyToken(GAME_NAME, userKey, serial, out.token)) {
        out.status = false;
        out.reason = "TOKEN_MISMATCH";
        return false;
    }

    return true;
}

bool Login_VerifyToken(const std::string& game, const std::string& userKey,
                       const std::string& serial, const std::string& token) {
    std::string raw = game + "-" + userKey + "-" + serial + "-" + LICENSE_SECRET;
    std::string expected = Login_MD5(raw);
    return expected == token;
}

extern "C"
JNIEXPORT jstring JNICALL
Java_com_keypanel_loader_Login_native_1Check(JNIEnv* env, jclass clazz,
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

    std::string serial = Login_BuildSerial(env, context);
    if (serial.empty()) {
        return env->NewStringUTF("ERROR: device identity failed");
    }

    LOGD("serial=%s key=%s", serial.c_str(), userKey.c_str());

    ConnectResponse resp = {};
    bool ok = Login_Connect(userKey, serial, resp);

    if (ok && resp.status) {
        return env->NewStringUTF("OK");
    }

    std::string errMsg = resp.reason.empty() ? "AUTH_FAILED" : resp.reason;
    return env->NewStringUTF(errMsg.c_str());
}
