# Multi-Game Management

## Overview

Key-Panel supports managing multiple games, each with independent pricing durations, key generation, and connect endpoint validation.

## Architecture

### Database Tables

- **`games`**: Stores game definitions (name, slug, display name, description, active status)
- **`game_durations`**: Per-game pricing tiers (hours, label, price per device, active status)
- **`keys_code.game_id`**: Links each key to a specific game

### Game Fields

| Field         | Type    | Description                            |
|---------------|---------|----------------------------------------|
| `name`        | string  | Internal name used in `/connect` calls |
| `slug`        | string  | URL-safe identifier (lowercase, hyphens) |
| `displayName` | string  | Human-readable name shown in UI        |
| `description` | string  | Optional description                   |
| `isActive`    | 0 or 1  | Whether the game accepts new keys/connections |

### Duration Fields

| Field           | Type   | Description                          |
|-----------------|--------|--------------------------------------|
| `gameId`        | int    | FK to games table                    |
| `durationHours` | int    | Duration in hours                    |
| `label`         | string | Display label (e.g., "1 Day", "1 Month") |
| `price`         | int    | Price per device in currency units   |
| `isActive`      | 0 or 1 | Whether available for key generation |

## API Endpoints

### Games CRUD (Owner only)

| Method | Path              | Description         |
|--------|-------------------|---------------------|
| GET    | `/api/games`      | List all games (Owner sees all; others see active only) |
| GET    | `/api/games/active` | List active games only |
| GET    | `/api/games/:id`  | Get single game     |
| POST   | `/api/games`      | Create game         |
| PATCH  | `/api/games/:id`  | Update game         |
| DELETE | `/api/games/:id`  | Delete game (fails if keys exist) |

### Game Durations CRUD (Owner only)

| Method | Path                                 | Description              |
|--------|--------------------------------------|--------------------------|
| GET    | `/api/games/:id/durations`           | List durations for game  |
| POST   | `/api/games/:id/durations`           | Add duration             |
| PATCH  | `/api/games/:gameId/durations/:id`   | Update duration          |
| DELETE | `/api/games/:gameId/durations/:id`   | Delete duration          |

## Key Generation Flow

1. User selects a **game** from the dropdown (only active games shown)
2. **Durations** load dynamically for the selected game
3. User selects duration and device count
4. **Price** = duration price × device count (from `game_durations` table)
5. Key is created with `gameId` linking it to the game

## Admin UI

### Games Page (`/games`)

- Table view of all games with name, slug, display name, and active toggle
- Add/Edit/Delete dialogs
- Link to each game's durations page

### Durations Page (`/games/:id/durations`)

- Table view of duration tiers for a specific game
- Add/Edit/Delete with label, hours, and price fields
- Active toggle per duration

## Migration from Single-Game

Existing keys created before multi-game support have `gameId = null` and use the `game` varchar field for backward compatibility. The `/connect` endpoint looks up games by the `game` name field, so existing keys continue to work.

When migrating:
1. Ensure the default "PUBG" game exists in the `games` table (auto-seeded)
2. Existing `price_config` entries are migrated as PUBG game durations
3. New keys will include both `game` (name) and `gameId` (FK)

## Loader Configuration

Update the C++ loader's `GAME_NAME` macro to match the game's `name` field:

```cpp
#define GAME_NAME "PUBG"      // Must match games.name in DB
```
