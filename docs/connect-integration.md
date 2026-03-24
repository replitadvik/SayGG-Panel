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

## Android Native Loader Integration

The `loader/` directory contains a production-ready Android NDK loader with JNI integration.

### File Structure

```
loader/
├── Login.h              # Header: structs, JNI declarations, helpers
├── Login.cpp            # Implementation: JNI entry, serial gen, HTTP, JSON, token
├── json.hpp             # Stub — replace with real nlohmann/json single-header
├── Android.mk           # ndk-build config
├── CMakeLists.txt       # CMake config (alternative)
└── java/com/keypanel/loader/
    └── Login.java       # Java-side companion class
```

### Build Configuration

Pass your secrets as build variables (never hardcode in source):

**CMake (app/build.gradle):**
```groovy
externalNativeBuild {
    cmake {
        arguments "-DKEYPANEL_ENDPOINT=https://yourdomain.com/connect",
                  "-DKEYPANEL_GAME=PUBG",
                  "-DKEYPANEL_SECRET=your-secret-here"
    }
}
```

**ndk-build:**
```makefile
KEYPANEL_ENDPOINT := https://yourdomain.com/connect
KEYPANEL_GAME     := PUBG
KEYPANEL_SECRET   := your-secret-here
```

### Optional TLS Pinning

Add `-DKEYPANEL_PINNED_KEY=sha256//base64hash=` to pin the server's public key.

### Java Usage

```java
import com.keypanel.loader.Login;

String result = Login.check(context, "MY-LICENSE-KEY");
if (Login.isOk(result)) {
    // Authenticated successfully
} else {
    // result contains error reason (e.g., "EXPIRED KEY", "TOKEN_MISMATCH")
}
```

### Device Serial Generation (Legacy-Compatible)

The loader builds a serial using the same algorithm as the legacy Java loader:

```
hwid = user_key + androidId + deviceModel + deviceBrand
serial = UUID.nameUUIDFromBytes(hwid.getBytes()).toString()
```

The C++ `Login_NameUUID()` function replicates Java's `UUID.nameUUIDFromBytes()` exactly:
1. MD5 hash the concatenated hwid bytes
2. Set version nibble to 3 (UUID v3)
3. Set variant bits to IETF
4. Format as `xxxxxxxx-xxxx-3xxx-Nxxx-xxxxxxxxxxxx`

**Important:** The serial depends on the user's key, so the same device with different keys produces different serials. This matches the legacy device-binding behavior.

### Client-Side Validation

After a successful `/connect` response, the loader verifies:
1. **Token** — `md5("{game}-{user_key}-{serial}-{secret}")` must match
2. **RNG window** — legacy-compatible: `(rng_ms / 1000) + 30 > time(0)` (server sends ms, loader converts to seconds)
3. **Required fields** — token, rng, and EXP must be present

### Setup Checklist

1. Download `json.hpp` from [nlohmann/json releases](https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp) and replace the stub
2. Add `libcurl` and `openssl` to your NDK dependencies
3. Set your endpoint, game name, and secret via build variables
4. Add `Login.java` to your app's source tree
5. Call `Login.check(context, key)` from your activity
