[file name]: login.php
[file content begin]
<?= $this->extend('Layout/Starter') ?>

<?= $this->section('css') ?>
<style>
/* ===== MIDNIGHT AURORA – PURPLE × MAGENTA × TEAL (glassy) ===== */
:root{
  --glass-bg: rgba(20,16,35,.22);
  --glass-border: rgba(190,130,255,.28);
  --brand1:#8a2be2;      /* electric purple  */
  --brand2:#ff2d95;      /* neon magenta     */
  --brand3:#22e6c2;      /* aurora teal      */
  --text:#f7f7fb;
  --muted:rgba(247,247,251,.78);
}

/* Background: deep night with aurora sweeps */
body{
  background:
  radial-gradient(1000px 700px at 15% 10%, rgba(79,172,254,.22), transparent 40%),
  radial-gradient(1000px 700px at 85% 90%, rgba(108,99,255,.20), transparent 40%),
  linear-gradient(135deg, #5c6fd2, #6b57c5) fixed;
  color:var(--text);
  font-family:'Poppins',sans-serif;
  min-height:100dvh;
  display:flex; align-items:center; justify-content:center;
  padding:16px;
}

/* Wrapper */
.auth-page{ width:100%; max-width:460px; }

/* Card */
.auth-card{
  background: linear-gradient(135deg, rgba(138,43,226,.08), rgba(34,230,194,.06)), var(--glass-bg);
  border:1px solid var(--glass-border);
  border-radius:20px;
  backdrop-filter: blur(18px) saturate(120%);
  -webkit-backdrop-filter: blur(18px) saturate(120%);
  box-shadow:
    0 14px 32px rgba(0,0,0,.45),
    inset 0 0 0 1px rgba(255,255,255,.04);
  overflow:hidden;
  position:relative;
}

/* subtle neon rim light */
.auth-card::after{
  content:"";
  position:absolute; inset:-2px;
  border-radius:22px;
  pointer-events:none;
  background: conic-gradient(from 140deg,
    rgba(138,43,226,.25),
    rgba(255,45,149,.25),
    rgba(34,230,194,.25),
    rgba(138,43,226,.25)
  );
  filter: blur(18px) saturate(120%);
  opacity:.20;
}

/* header */
.auth-head{
  padding:20px 16px;
  text-align:center;
  font-weight:900; letter-spacing:.9px;
  background:
    linear-gradient(90deg, rgba(138,43,226,.18), rgba(255,45,149,.16), rgba(34,230,194,.14));
  border-bottom:1px solid var(--glass-border);
  text-shadow:0 2px 18px rgba(138,43,226,.35);
}

/* body */
.auth-body{ padding:18px; }

/* flash / status area */
.status-wrap{ margin-bottom:14px; }

/* Labels + inputs */
.form-label{
  font-weight:700; font-size:12.5px; margin-bottom:6px; color:var(--text);
  letter-spacing:.4px;
}

.input-glass{
  width:100%; border:none; border-radius:14px;
  background: rgba(255,255,255,.06);
  color:#fff; padding:13px 14px;
  transition:.25s; line-height:1.25;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
}
.input-glass::placeholder{ color:#e8e6ff; opacity:.85; }
.input-glass:focus{
  outline:none;
  background: rgba(255,255,255,.12);
  box-shadow:
    0 0 0 3px rgba(138,43,226,.25),
    inset 0 0 0 1px rgba(255,255,255,.10);
}

/* Checkbox row - updated for toggle and forgot password */
.check-row{ 
  display:flex; 
  align-items:center; 
  justify-content:space-between; 
  margin:10px 0 16px; 
}

/* Toggle switch styles */
.toggle-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 42px;
  height: 22px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255,255,255,.12);
  border-radius: 34px;
  transition: .3s;
  border: 1px solid rgba(255,255,255,.1);
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 2px;
  background: rgba(255,255,255,.6);
  border-radius: 50%;
  transition: .3s;
}

input:checked + .toggle-slider {
  background: linear-gradient(45deg, var(--brand1), var(--brand2));
}

input:checked + .toggle-slider:before {
  transform: translateX(20px);
  background: white;
}

.toggle-label {
  font-size:12.5px; 
  color:var(--muted);
  font-weight: 600;
}

/* Forgot password button */
.forgot-password {
  background: transparent;
  border: 1px solid rgba(255,255,255,.15);
  border-radius: 10px;
  color: var(--muted);
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  text-decoration: none;
}

.forgot-password:hover {
  background: rgba(255,255,255,.08);
  border-color: rgba(255,255,255,.25);
  color: var(--text);
}

/* Button */
.btn-glass{
  width:100%; border:none; border-radius:14px;
  padding:13px 14px; font-weight:900; letter-spacing:.5px;
  color:#0b0a12; cursor:pointer;
  background: linear-gradient(45deg, var(--brand1), var(--brand2) 60%, var(--brand3));
  transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
  box-shadow: 0 10px 22px rgba(138,43,226,.25), 0 6px 16px rgba(255,45,149,.20);
}
.btn-glass:hover{ transform:translateY(-2px); filter:saturate(110%); }
.btn-glass:active{ transform:translateY(0); }

/* register link */
.register-text{ text-align:center; margin-top:14px; color:var(--muted); font-size:13px; }
.register-text a{
  color:var(--brand3); font-weight:800; text-decoration:none;
  text-shadow:0 0 14px rgba(34,230,194,.35);
}
.register-text a:hover{ text-decoration:underline; }

/* helpers */
.text-danger{ color:#ff6b8a !important; }
.small{ font-size:.875rem; }
.mt-1{ margin-top:.25rem; }
.mb-2{ margin-bottom:.75rem; }

/* motion safety */
@media (prefers-reduced-motion: reduce){
  .btn-glass, .input-glass{ transition:none; }
}

/* mobile tweaks */
@media (max-width:380px){
  .auth-body{ padding:16px; }
  .btn-glass{ padding:12px; }
  .check-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .forgot-password {
    align-self: flex-end;
  }
}
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<div class="auth-page">
  <div class="auth-card">
    <div class="auth-head">SYSTEM LOGIN</div>
    <div class="auth-body">
      <div class="status-wrap">
        <?= $this->include('Layout/msgStatus') ?>
      </div>

      <?= form_open() ?>
        <audio src="https://vip-key.xyz/AUDIO/welcome.mp3" autoplay="autoplay"></audio>

        <div class="mb-2">
          <label for="username" class="form-label">USERNAME</label>
          <input type="text" class="input-glass" name="username" id="username"
                 placeholder="Enter your username" required minlength="4">
          <?php if ($validation->hasError('username')) : ?>
            <div class="text-danger small mt-1"><?= $validation->getError('username') ?></div>
          <?php endif; ?>
        </div>

        <div class="mb-2">
          <label for="password" class="form-label">PASSWORD</label>
          <input type="password" class="input-glass" name="password" id="password"
                 placeholder="Enter your password" required minlength="6">
          <?php if ($validation->hasError('password')) : ?>
            <div class="text-danger small mt-1"><?= $validation->getError('password') ?></div>
          <?php endif; ?>
        </div>

        <!-- ✅ Hidden device id for single-device login -->
        <input type="hidden" name="device_id" id="device_id">

        <!-- Existing hidden field -->
        <input type="hidden" name="ip" value="<?= $_SERVER['HTTP_USER_AGENT'] ?>">

        <div class="check-row">
          <div class="toggle-wrapper">
            <label class="toggle-switch">
              <input type="checkbox" id="stay_log" name="stay_log" value="yes">
              <span class="toggle-slider"></span>
            </label>
            <label for="stay_log" class="toggle-label">STAY LOGGED IN</label>
          </div>
          <a href="<?= site_url('forgot-password') ?>" class="forgot-password">FORGOT PASSWORD?</a>
        </div>

        <button type="submit" class="btn-glass">ACCESS SYSTEM</button>
      <?= form_close() ?>

      <p class="register-text">
        DON'T HAVE AN ACCOUNT?
        <a href="<?= site_url('register') ?>">REGISTER HERE</a>
      </p>
      <p class="register-text">
        FORGOT DEVICE LOCK?
        <a href="<?= site_url('device-reset') ?>">RESET DEVICE</a>
      </p>
    </div>
  </div>
</div>

<script>
// ✅ Generate or reuse device_id and set in hidden field
(function() {
  var key = "device_id";
  var deviceId = localStorage.getItem(key);
  if (!deviceId) {
    deviceId = "web-" + Math.random().toString(36).substr(2, 16);
    localStorage.setItem(key, deviceId);
  }
  document.getElementById("device_id").value = deviceId;
})();
</script>

<?= $this->endSection() ?>
[file content end]