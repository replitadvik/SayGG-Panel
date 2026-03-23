# Migration Mapping: PHP CodeIgniter 4 → TypeScript Full-Stack

## Route Mapping

| PHP Route / Controller Method | New TypeScript Endpoint | File |
|---|---|---|
| `POST /auth/login` (AuthController::login) | `POST /api/auth/login` | server/routes.ts |
| `POST /auth/verify-otp` (AuthController::verifyOtp) | `POST /api/auth/verify-otp` | server/routes.ts |
| `POST /auth/register` (AuthController::register) | `POST /api/auth/register` | server/routes.ts |
| `POST /auth/forgot-password` (AuthController::forgotPassword) | `POST /api/auth/forgot-password` | server/routes.ts |
| `POST /auth/reset-password` (AuthController::resetPassword) | `POST /api/auth/reset-password` | server/routes.ts |
| `POST /auth/device-reset` (AuthController::deviceReset) | `POST /api/auth/device-reset` | server/routes.ts |
| `POST /auth/logout` (AuthController::logout) | `POST /api/auth/logout` | server/routes.ts |
| `GET /auth/me` (AuthController::me) | `GET /api/auth/me` | server/routes.ts |
| `GET /keys` (KeyController::index) | `GET /api/keys` | server/routes.ts |
| `GET /keys/:id` (KeyController::show) | `GET /api/keys/:id` | server/routes.ts |
| `POST /keys/generate` (KeyController::generate) | `POST /api/keys/generate` | server/routes.ts |
| `PUT /keys/:id` (KeyController::update) | `PATCH /api/keys/:id` | server/routes.ts |
| `POST /keys/:id/extend` (KeyController::extend) | `POST /api/keys/:id/extend` | server/routes.ts |
| `DELETE /keys/:id` (KeyController::delete) | `DELETE /api/keys/:id` | server/routes.ts |
| `POST /keys/bulk-delete` (KeyController::bulkDelete) | `POST /api/keys/bulk-delete` | server/routes.ts |
| `POST /keys/:id/reset-device` (KeyController::resetDevice) | `POST /api/keys/:id/reset-device` | server/routes.ts |
| `GET /users` (UserController::index) | `GET /api/users` | server/routes.ts |
| `GET /users/:id` (UserController::show) | `GET /api/users/:id` | server/routes.ts |
| `POST /users/:id/approve` (UserController::approve) | `POST /api/users/:id/approve` | server/routes.ts |
| `POST /users/:id/decline` (UserController::decline) | `POST /api/users/:id/decline` | server/routes.ts |
| `PUT /users/:id` (UserController::update) | `PATCH /api/users/:id` | server/routes.ts |
| `DELETE /users/:id` (UserController::delete) | `DELETE /api/users/:id` | server/routes.ts |
| `POST /users/:id/reset-device` (UserController::resetDevice) | `POST /api/users/:id/reset-device` | server/routes.ts |
| `POST /users/balance` (UserController::addBalance) | `POST /api/users/balance` | server/routes.ts |
| `PATCH /profile/username` (ProfileController::updateUsername) | `PATCH /api/profile/username` | server/routes.ts |
| `PATCH /profile/password` (ProfileController::updatePassword) | `PATCH /api/profile/password` | server/routes.ts |
| `PATCH /profile/telegram` (ProfileController::updateTelegram) | `PATCH /api/profile/telegram` | server/routes.ts |
| `PATCH /profile/2fa` (ProfileController::update2fa) | `PATCH /api/profile/2fa` | server/routes.ts |
| `GET /referrals` (ReferralController::index) | `GET /api/referrals` | server/routes.ts |
| `POST /referrals` (ReferralController::create) | `POST /api/referrals` | server/routes.ts |
| `GET /prices` (PriceController::index) | `GET /api/prices` | server/routes.ts |
| `GET /prices/all` (PriceController::all) | `GET /api/prices/all` | server/routes.ts |
| `POST /prices` (PriceController::upsert) | `POST /api/prices` | server/routes.ts |
| `DELETE /prices/:duration` (PriceController::deactivate) | `DELETE /api/prices/:duration` | server/routes.ts |
| `GET /settings/features` (SettingsController::features) | `GET /api/settings/features` | server/routes.ts |
| `PATCH /settings/features` (SettingsController::updateFeatures) | `PATCH /api/settings/features` | server/routes.ts |
| `GET /settings/modname` (SettingsController::modname) | `GET /api/settings/modname` | server/routes.ts |
| `PATCH /settings/modname` (SettingsController::updateModname) | `PATCH /api/settings/modname` | server/routes.ts |
| `GET /settings/ftext` (SettingsController::ftext) | `GET /api/settings/ftext` | server/routes.ts |
| `PATCH /settings/ftext` (SettingsController::updateFtext) | `PATCH /api/settings/ftext` | server/routes.ts |
| `GET /settings/maintenance` (SettingsController::maintenance) | `GET /api/settings/maintenance` | server/routes.ts |
| `PATCH /settings/maintenance` (SettingsController::updateMaintenance) | `PATCH /api/settings/maintenance` | server/routes.ts |
| `GET /dashboard/stats` (DashboardController::stats) | `GET /api/dashboard/stats` | server/routes.ts |
| `POST /connect` (ConnectController::index) | `POST /connect` | server/routes.ts |
| `GET /games` (GameController::list) | `GET /api/games` | server/routes.ts |

## Database Table Mapping

| PHP/MySQL Table | Drizzle Table | Schema File |
|---|---|---|
| `users` | `users` | shared/schema.ts |
| `keys_code` | `keysCode` | shared/schema.ts |
| `referral_code` | `referralCode` | shared/schema.ts |
| `price_config` | `priceConfig` | shared/schema.ts |
| `feature` | `feature` | shared/schema.ts |
| `modname` | `modname` | shared/schema.ts |
| `_ftext` | `ftext` | shared/schema.ts |
| `onoff` | `onoff` | shared/schema.ts |
| `history` | `history` | shared/schema.ts |
| `login_throttle` | `loginThrottle` | shared/schema.ts |

## Model → Storage Method Mapping

| PHP Model Method | TypeScript Storage Method | File |
|---|---|---|
| `UserModel::find($id)` | `storage.getUser(id)` | server/storage.ts |
| `UserModel::where('username', $u)->first()` | `storage.getUserByUsername(username)` | server/storage.ts |
| `UserModel::findAll()` | `storage.getAllUsers()` | server/storage.ts |
| `UserModel::where('uplink', $u)->findAll()` | `storage.getUsersByUplink(uplink)` | server/storage.ts |
| `UserModel::insert($data)` | `storage.createUser(data)` | server/storage.ts |
| `UserModel::update($id, $data)` | `storage.updateUser(id, data)` | server/storage.ts |
| `UserModel::delete($id)` | `storage.deleteUser(id)` | server/storage.ts |
| `KeyModel::find($id)` | `storage.getKey(id)` | server/storage.ts |
| `KeyModel::where(...)->first()` | `storage.getKeyByUserKeyAndGame(userKey, game)` | server/storage.ts |
| `KeyModel::findAll()` | `storage.getAllKeys()` | server/storage.ts |
| `KeyModel::where('registrator', $r)->findAll()` | `storage.getKeysByRegistrator(registrator)` | server/storage.ts |
| `KeyModel::insert($data)` | `storage.createKey(data)` | server/storage.ts |
| `KeyModel::update($id, $data)` | `storage.updateKey(id, data)` | server/storage.ts |
| `KeyModel::delete($id)` | `storage.deleteKey(id)` | server/storage.ts |
| `KeyModel::whereIn('id', $ids)->delete()` | `storage.deleteKeys(ids)` | server/storage.ts |
| `KeyModel::where('registrator', $r)->set(['status'=>0])->update()` | `storage.blockKeysByRegistrator(registrator)` | server/storage.ts |
| `ReferralModel::findAll()` | `storage.getReferralCodes()` | server/storage.ts |
| `ReferralModel::insert($data)` | `storage.createReferral(data)` | server/storage.ts |
| `ReferralModel::where('code', $c)->first()` | `storage.checkReferralCode(code)` | server/storage.ts |
| `ReferralModel::update($id, ['used_by'=>$u])` | `storage.useReferral(id, usedBy)` | server/storage.ts |
| `PriceModel::findAll()` | `storage.getPrices()` | server/storage.ts |
| `PriceModel::where('is_active', 1)->findAll()` | `storage.getActivePrices()` | server/storage.ts |
| `PriceModel::upsert(...)` | `storage.upsertPrice(duration, price)` | server/storage.ts |
| `PriceModel::deactivate($d)` | `storage.deactivatePrice(duration)` | server/storage.ts |
| `FeatureModel::first()` | `storage.getFeatures()` | server/storage.ts |
| `FeatureModel::update(...)` | `storage.updateFeatures(data)` | server/storage.ts |
| `ModnameModel::first()` | `storage.getModname()` | server/storage.ts |
| `ModnameModel::update(...)` | `storage.updateModname(name)` | server/storage.ts |
| `FtextModel::first()` | `storage.getFtext()` | server/storage.ts |
| `FtextModel::update(...)` | `storage.updateFtext(data)` | server/storage.ts |
| `OnoffModel::first()` | `storage.getMaintenanceStatus()` | server/storage.ts |
| `OnoffModel::update(...)` | `storage.updateMaintenance(status, myinput)` | server/storage.ts |
| `HistoryModel::insert(...)` | `storage.createHistory(data)` | server/storage.ts |

## Auth / Helper Mapping

| PHP Function | TypeScript Function | File |
|---|---|---|
| `create_password($p)` (md5→sha256) | `hashPassword(password)` | server/auth.ts |
| `verify_password($p, $h)` | `verifyPassword(plain, hashed)` | server/auth.ts |
| `generate_key_license($d)` | `generateKeyLicense(durationHours)` | server/auth.ts |
| `get_duration_label($h)` | `getDurationLabel(hours)` | server/auth.ts |
| `format_duration($h)` | `formatDuration(hours)` | server/auth.ts |
| `get_price($prices, $d, $m)` | `getPrice(prices, duration, maxDevices)` | server/auth.ts |
| `get_level_name($l)` | `getLevelName(level)` | server/auth.ts |

## Frontend Page Mapping

| PHP View | React Page | File |
|---|---|---|
| `Views/auth/login.php` | `LoginPage` | client/src/pages/login.tsx |
| `Views/auth/register.php` | `RegisterPage` | client/src/pages/register.tsx |
| `Views/auth/forgot_password.php` | `ForgotPasswordPage` | client/src/pages/forgot-password.tsx |
| `Views/auth/device_reset.php` | `DeviceResetPage` | client/src/pages/device-reset.tsx |
| `Views/dashboard/index.php` | `DashboardPage` | client/src/pages/dashboard.tsx |
| `Views/keys/index.php` | `KeysPage` | client/src/pages/keys.tsx |
| `Views/keys/generate.php` | `GeneratePage` | client/src/pages/generate.tsx |
| `Views/users/index.php` | `UsersPage` | client/src/pages/users.tsx |
| `Views/balance/index.php` | `BalancePage` | client/src/pages/balance.tsx |
| `Views/referrals/index.php` | `ReferralsPage` | client/src/pages/referrals.tsx |
| `Views/prices/index.php` | `PricesPage` | client/src/pages/prices.tsx |
| `Views/settings/index.php` | `SettingsPage` | client/src/pages/settings.tsx |
| `Views/profile/index.php` | `ProfilePage` | client/src/pages/profile.tsx |

## Role System

| Level | Name | PHP Check | TypeScript Check |
|---|---|---|---|
| 1 | Owner | `session('level') == 1` | `user.level === 1` / `requireLevel(1)` |
| 2 | Admin | `session('level') <= 2` | `user.level <= 2` / `requireLevel(2)` |
| 3 | Reseller | `session('level') <= 3` | `user.level <= 3` / `requireAuth` |

## Key Business Logic Preserved

- Password hashing: `md5(plain) → sha256(md5)` (matches `create_password()`)
- Key format: `PowerHouse_[DurationLabel]_[5-char-random]`
- Static token: `md5(game-key-serial-staticWords)` for `/connect`
- Login throttle: 5 attempts → 15 min block
- Key device reset: counter-based (max 3 for non-owners)
- User device reset: 2 per 24 hours
- Reseller restrictions: max 2 devices per key, no custom keys
- Ban cascades: declining a user blocks all their keys
- Saldo deducted on key generation with history record
