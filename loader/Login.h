#pragma once

#ifndef ENDPOINT_URL
#define ENDPOINT_URL "https://yourdomain.com/connect"
#endif

#ifndef GAME_NAME
#define GAME_NAME "YourGame"
#endif

#ifndef LICENSE_SECRET
#define LICENSE_SECRET "REPLACE_WITH_YOUR_SECRET"
#endif

#include <string>

struct ConnectResponse {
    bool status;
    std::string reason;
    std::string token;
    std::string real;
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
    int device;
    long long rng;
    std::string game;
    std::string gameDisplayName;
    std::string keyStatus;
    std::string durationLabel;
    std::string expiresAt;
    long long timeLeftMs;
    std::string timeLeft;
    int maxDevices;
    int usedDevices;
};

bool Login_Connect(const std::string& userKey, const std::string& serial, ConnectResponse& out);
bool Login_VerifyToken(const std::string& game, const std::string& userKey, const std::string& serial, const std::string& token);
std::string Login_MD5(const std::string& input);
