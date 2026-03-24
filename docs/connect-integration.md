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

All three required macros (`ENDPOINT_URL`, `GAME_NAME`, `LICENSE_SECRET`) are enforced at compile time via `#error` — the build will fail if any is missing.

**CMake (app/build.gradle):**
```groovy
android {
    defaultConfig {
        externalNativeBuild {
            cmake {
                arguments "-DKEYPANEL_ENDPOINT=https://yourserver.com/connect",
                          "-DKEYPANEL_GAME=PUBG",
                          "-DKEYPANEL_SECRET=your-production-secret"
            }
        }
    }
}
```

**Per-game builds via product flavors:**
```groovy
productFlavors {
    pubg {
        dimension "game"
        externalNativeBuild {
            cmake { arguments "-DKEYPANEL_GAME=PUBG" }
        }
    }
    bgmi {
        dimension "game"
        externalNativeBuild {
            cmake { arguments "-DKEYPANEL_GAME=BGMI" }
        }
    }
}
```

**ndk-build:**
```makefile
KEYPANEL_ENDPOINT := https://yourserver.com/connect
KEYPANEL_GAME     := PUBG
KEYPANEL_SECRET   := your-production-secret
```

### Optional Configuration

| Macro | Purpose | Example |
|---|---|---|
| `PINNED_PUBLIC_KEY` | TLS public key pinning | `sha256//AAAA...=` |
| `JNI_CLASS_PATH` | Java class for RegisterNatives | `com/myapp/auth/Loader` |
| `RNG_WINDOW_SEC` | RNG validation window (default 30) | `60` |

### JNI Class Binding

The native method is registered at library load via `JNI_OnLoad` + `RegisterNatives`.
The target class defaults to `com/keypanel/loader/Login`.

To use a different package/class:
1. Set `-DKEYPANEL_JNI_CLASS=com/myapp/auth/Loader` in your build
2. Move/copy `Login.java` into the matching package and update its `package` declaration
3. The Java class must declare: `static native String native_Check(Context ctx, String key);`

### Java Usage

```java
import com.keypanel.loader.Login;

String result = Login.check(context, "MY-LICENSE-KEY");
if (Login.isOk(result)) {
    // Authenticated — proceed to app
} else {
    // result is a specific reason string:
    //   "EXPIRED KEY", "TOKEN_MISMATCH", "RNG_EXPIRED",
    //   "TLS_ERROR", "NETWORK_ERROR", "TIMEOUT", "HTTP_403", etc.
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

### RNG Validation

The loader auto-detects whether `rng` is in seconds or milliseconds:
- If `rng > 9999999999` (10+ digits) → treated as milliseconds, divided by 1000
- Otherwise → treated as seconds directly

After normalising to seconds, applies the legacy check: `rng_sec + RNG_WINDOW_SEC > time(0)`

This is compatible with both the legacy PHP backend (which sent seconds) and the new Node.js backend (which sends `Date.now()` in milliseconds).

### Client-Side Validation

After a successful `/connect` response, the loader verifies:
1. **Token** — `md5("{game}-{user_key}-{serial}-{secret}")` must match
2. **RNG window** — auto-detected seconds/ms, then `rng_sec + 30 > time(0)`
3. **Required fields** — token, rng, and EXP must be present

### Error Reasons

The loader returns specific error strings for different failure modes:

| Return Value | Cause |
|---|---|
| `OK` | Authentication succeeded |
| `TLS_ERROR` | SSL/TLS handshake or certificate failure |
| `NETWORK_ERROR` | DNS or connection failure |
| `TIMEOUT` | Request timed out |
| `HTTP_4xx` / `HTTP_5xx` | Non-200 HTTP response |
| `INVALID_RESPONSE` | Response is not valid JSON |
| `MISSING_DATA` / `MISSING_TOKEN` / `MISSING_RNG` / `MISSING_EXP` | Required field absent |
| `RNG_EXPIRED` | Server timestamp outside window |
| `TOKEN_MISMATCH` | Token verification failed |
| `EXPIRED KEY`, `USER BLOCKED`, etc. | Backend-returned reason |

### Setup Checklist

1. Download `json.hpp` from [nlohmann/json releases](https://github.com/nlohmann/json/releases/download/v3.11.3/json.hpp) and replace the stub
2. Add `libcurl` and `openssl` to your NDK dependencies
3. Set `KEYPANEL_ENDPOINT`, `KEYPANEL_GAME`, and `KEYPANEL_SECRET` via build variables
4. Optionally set `KEYPANEL_JNI_CLASS` if your package differs from `com.keypanel.loader`
5. Add `Login.java` to your app's source tree (matching the JNI class path)
6. Call `Login.check(context, key)` from your activity
