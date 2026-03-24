# Connect Endpoint Integration Guide

## Overview

The `/connect` endpoint authenticates game clients (loaders) against the Key-Panel server. It validates the user's license key, manages device slots, and returns feature flags + token data.

## Endpoint

```
POST /connect
Content-Type: application/json
```

## Request Body

| Field      | Type   | Required | Description                          |
|------------|--------|----------|--------------------------------------|
| `game`     | string | Yes      | Game name (must match a game in DB)  |
| `user_key` | string | Yes      | The license key                      |
| `serial`   | string | Yes      | Unique device/hardware identifier    |

### Example Request

```json
{
  "game": "PUBG",
  "user_key": "ABC-1234-XYZ",
  "serial": "DEVICE-HW-ID-123"
}
```

## Response

### Success Response

```json
{
  "status": true,
  "data": {
    "real": "PUBG-ABC-1234-XYZ-DEVICE-HW-ID-123-<secret>",
    "token": "md5hash...",
    "secret_version": 1,
    "modname": "MyMod",
    "mod_status": "active",
    "credit": "Powered by KeyPanel",
    "ESP": "on",
    "Item": "off",
    "AIM": "on",
    "SilentAim": "off",
    "BulletTrack": "off",
    "Floating": "off",
    "Memory": "off",
    "Setting": "on",
    "EXP": "2026-04-01T00:00:00.000Z",
    "device": 2,
    "rng": 1711234567890,
    "game": "PUBG",
    "gameDisplayName": "PUBG Mobile",
    "keyStatus": "active",
    "durationLabel": "1 Month",
    "expiresAt": "2026-04-01T00:00:00.000Z",
    "timeLeftMs": 604800000,
    "timeLeft": "168h 0m",
    "maxDevices": 2,
    "usedDevices": 1
  }
}
```

### Error Response

```json
{
  "status": false,
  "reason": "REASON_CODE"
}
```

### Reason Codes

| Code                        | Description                              |
|-----------------------------|------------------------------------------|
| `INVALID PARAMETER`         | Missing game, user_key, or serial        |
| `GAME NOT FOUND`            | Game name doesn't exist in database      |
| `GAME INACTIVE`             | Game exists but is disabled              |
| `USER OR GAME NOT REGISTERED` | Key not found for this game            |
| `USER BLOCKED`              | Key status is blocked                    |
| `EXPIRED KEY`               | Key has expired                          |
| `MAX DEVICE REACHED`        | All device slots are occupied            |
| `INTERNAL ERROR`            | Server-side error                        |

## Token Verification

The token is an MD5 hash of: `{game}-{user_key}-{serial}-{active_secret}`

To verify on the client side:

```cpp
std::string raw = game + "-" + userKey + "-" + serial + "-" + LICENSE_SECRET;
std::string expected = md5(raw);
bool valid = (expected == receivedToken);
```

## Multi-Game Support

The endpoint now validates the `game` field against the `games` database table. Each game can be independently activated/deactivated. The enriched response includes game-specific fields like `gameDisplayName`, `durationLabel`, and device usage info.

## Secret Rotation

The server supports secret rotation with a grace period. During rotation, both the active and previous secrets are valid. The `secret_version` field increments with each rotation, allowing clients to track which secret was used.

## C++ Loader Integration

See `loader/Login.h` and `loader/Login.cpp` for a ready-to-use C++ implementation. Configure these macros at compile time:

```cpp
#define ENDPOINT_URL "https://yourdomain.com/connect"
#define GAME_NAME "PUBG"
#define LICENSE_SECRET "your-secret-here"
```
