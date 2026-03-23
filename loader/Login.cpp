#include "Login.h"

#include <cstdio>
#include <cstring>
#include <sstream>
#include <iomanip>
#include <stdexcept>

#ifdef _WIN32
#include <windows.h>
#include <winhttp.h>
#pragma comment(lib, "winhttp.lib")
#else
#include <curl/curl.h>
#endif

#include <openssl/md5.h>

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

static std::string build_post_body(const std::string& userKey, const std::string& serial) {
    return "game=" + url_encode(GAME_NAME) +
           "&user_key=" + url_encode(userKey) +
           "&serial=" + url_encode(serial);
}

static std::string extract_json_string(const std::string& json, const std::string& key) {
    std::string search = "\"" + key + "\"";
    size_t pos = json.find(search);
    if (pos == std::string::npos) return "";
    pos = json.find(':', pos);
    if (pos == std::string::npos) return "";
    pos++;
    while (pos < json.size() && (json[pos] == ' ' || json[pos] == '\t')) pos++;
    if (pos >= json.size()) return "";
    if (json[pos] == '"') {
        pos++;
        size_t end = json.find('"', pos);
        if (end == std::string::npos) return "";
        return json.substr(pos, end - pos);
    }
    size_t end = json.find_first_of(",}", pos);
    if (end == std::string::npos) end = json.size();
    std::string val = json.substr(pos, end - pos);
    while (!val.empty() && (val.back() == ' ' || val.back() == '\n' || val.back() == '\r'))
        val.pop_back();
    return val;
}

static bool extract_json_bool(const std::string& json, const std::string& key) {
    std::string val = extract_json_string(json, key);
    return val == "true";
}

static long long extract_json_long(const std::string& json, const std::string& key) {
    std::string val = extract_json_string(json, key);
    if (val.empty()) return 0;
    try { return std::stoll(val); } catch (...) { return 0; }
}

static int extract_json_int(const std::string& json, const std::string& key) {
    std::string val = extract_json_string(json, key);
    if (val.empty()) return 0;
    try { return std::stoi(val); } catch (...) { return 0; }
}

#ifndef _WIN32
struct CurlWriteData {
    std::string body;
};

static size_t curl_write_callback(char* ptr, size_t size, size_t nmemb, void* userdata) {
    size_t totalSize = size * nmemb;
    CurlWriteData* wd = static_cast<CurlWriteData*>(userdata);
    wd->body.append(ptr, totalSize);
    return totalSize;
}

static bool http_post(const std::string& url, const std::string& postBody, std::string& responseOut) {
    CURL* curl = curl_easy_init();
    if (!curl) return false;

    CurlWriteData wd;
    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POST, 1L);
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, postBody.c_str());
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, curl_write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &wd);
    curl_easy_setopt(curl, CURLOPT_TIMEOUT, 15L);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 1L);
    curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 2L);

    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/x-www-form-urlencoded");
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);

    CURLcode res = curl_easy_perform(curl);
    curl_slist_free_all(headers);
    curl_easy_cleanup(curl);

    if (res != CURLE_OK) return false;
    responseOut = wd.body;
    return true;
}
#else
static bool http_post(const std::string& url, const std::string& postBody, std::string& responseOut) {
    URL_COMPONENTSA urlComp;
    memset(&urlComp, 0, sizeof(urlComp));
    urlComp.dwStructSize = sizeof(urlComp);
    char hostName[256] = {0};
    char urlPath[1024] = {0};
    urlComp.lpszHostName = hostName;
    urlComp.dwHostNameLength = sizeof(hostName);
    urlComp.lpszUrlPath = urlPath;
    urlComp.dwUrlPathLength = sizeof(urlPath);

    if (!WinHttpCrackUrl(std::wstring(url.begin(), url.end()).c_str(), 0, 0,
                          reinterpret_cast<URL_COMPONENTS*>(&urlComp))) {
        return false;
    }

    std::wstring wHost(hostName, hostName + strlen(hostName));
    std::wstring wPath(urlPath, urlPath + strlen(urlPath));

    HINTERNET hSession = WinHttpOpen(L"KeyPanel-Loader/1.0",
        WINHTTP_ACCESS_TYPE_DEFAULT_PROXY,
        WINHTTP_NO_PROXY_NAME, WINHTTP_NO_PROXY_BYPASS, 0);
    if (!hSession) return false;

    HINTERNET hConnect = WinHttpConnect(hSession, wHost.c_str(),
        urlComp.nPort, 0);
    if (!hConnect) { WinHttpCloseHandle(hSession); return false; }

    DWORD flags = (urlComp.nScheme == INTERNET_SCHEME_HTTPS) ? WINHTTP_FLAG_SECURE : 0;
    HINTERNET hRequest = WinHttpOpenRequest(hConnect, L"POST",
        wPath.c_str(), NULL, WINHTTP_NO_REFERER,
        WINHTTP_DEFAULT_ACCEPT_TYPES, flags);
    if (!hRequest) {
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }

    const wchar_t* contentType = L"Content-Type: application/x-www-form-urlencoded";
    BOOL sent = WinHttpSendRequest(hRequest, contentType, -1,
        (LPVOID)postBody.c_str(), (DWORD)postBody.size(),
        (DWORD)postBody.size(), 0);

    if (!sent || !WinHttpReceiveResponse(hRequest, NULL)) {
        WinHttpCloseHandle(hRequest);
        WinHttpCloseHandle(hConnect);
        WinHttpCloseHandle(hSession);
        return false;
    }

    responseOut.clear();
    DWORD bytesAvailable = 0;
    while (WinHttpQueryDataAvailable(hRequest, &bytesAvailable) && bytesAvailable > 0) {
        char* buf = new char[bytesAvailable + 1];
        DWORD bytesRead = 0;
        WinHttpReadData(hRequest, buf, bytesAvailable, &bytesRead);
        buf[bytesRead] = '\0';
        responseOut.append(buf, bytesRead);
        delete[] buf;
    }

    WinHttpCloseHandle(hRequest);
    WinHttpCloseHandle(hConnect);
    WinHttpCloseHandle(hSession);
    return true;
}
#endif

bool Login_Connect(const std::string& userKey, const std::string& serial, ConnectResponse& out) {
    std::string postBody = build_post_body(userKey, serial);
    std::string response;

    if (!http_post(ENDPOINT_URL, postBody, response)) {
        out.status = false;
        out.reason = "CONNECTION_FAILED";
        return false;
    }

    out.status = extract_json_bool(response, "status");
    if (!out.status) {
        out.reason = extract_json_string(response, "reason");
        return false;
    }

    size_t dataPos = response.find("\"data\"");
    std::string dataBlock = response;
    if (dataPos != std::string::npos) {
        size_t braceStart = response.find('{', dataPos);
        if (braceStart != std::string::npos) {
            int depth = 0;
            size_t braceEnd = braceStart;
            for (size_t i = braceStart; i < response.size(); ++i) {
                if (response[i] == '{') depth++;
                else if (response[i] == '}') { depth--; if (depth == 0) { braceEnd = i; break; } }
            }
            dataBlock = response.substr(braceStart, braceEnd - braceStart + 1);
        }
    }

    out.token = extract_json_string(dataBlock, "token");
    out.real = extract_json_string(dataBlock, "real");
    out.modname = extract_json_string(dataBlock, "modname");
    out.mod_status = extract_json_string(dataBlock, "mod_status");
    out.credit = extract_json_string(dataBlock, "credit");
    out.ESP = extract_json_string(dataBlock, "ESP");
    out.Item = extract_json_string(dataBlock, "Item");
    out.AIM = extract_json_string(dataBlock, "AIM");
    out.SilentAim = extract_json_string(dataBlock, "SilentAim");
    out.BulletTrack = extract_json_string(dataBlock, "BulletTrack");
    out.Floating = extract_json_string(dataBlock, "Floating");
    out.Memory = extract_json_string(dataBlock, "Memory");
    out.Setting = extract_json_string(dataBlock, "Setting");
    out.EXP = extract_json_string(dataBlock, "EXP");
    out.device = extract_json_int(dataBlock, "device");
    out.rng = extract_json_long(dataBlock, "rng");

    return true;
}

bool Login_VerifyToken(const std::string& game, const std::string& userKey, const std::string& serial, const std::string& token) {
    std::string raw = game + "-" + userKey + "-" + serial + "-" + LICENSE_SECRET;
    std::string expected = Login_MD5(raw);
    return expected == token;
}
