<?= $this->extend('Layout/Starter') ?>

<?= $this->section('css') ?>
<style>
:root {
  --glass-bg: rgba(20,16,35,.22);
  --glass-border: rgba(190,130,255,.28);
  --brand1:#8a2be2;
  --brand2:#ff2d95;
  --brand3:#22e6c2;
  --text:#f7f7fb;
  --muted:rgba(247,247,251,.78);
}
body{
  background: linear-gradient(135deg,#5c6fd2,#6b57c5) fixed;
  color:var(--text); font-family:'Poppins',sans-serif;
  min-height:100dvh; display:flex; align-items:center; justify-content:center;
  padding:16px;
}
.auth-card{
  background: linear-gradient(135deg, rgba(138,43,226,.08), rgba(34,230,194,.06)), var(--glass-bg);
  border:1px solid var(--glass-border); border-radius:20px;
  backdrop-filter: blur(18px) saturate(120%);
  box-shadow:0 14px 32px rgba(0,0,0,.45), inset 0 0 0 1px rgba(255,255,255,.04);
  width:100%; max-width:460px; overflow:hidden;
}
.auth-head{ padding:20px 16px; text-align:center; font-weight:900; }
.auth-body{ padding:18px; }
.form-label{ font-weight:700; font-size:13px; margin-bottom:6px; }
.input-glass{
  width:100%; border:none; border-radius:14px;
  background: rgba(255,255,255,.06); color:#fff;
  padding:13px 14px; margin-bottom:12px;
}
.btn-glass{
  width:100%; border:none; border-radius:14px;
  padding:13px; font-weight:900; letter-spacing:.5px;
  background:linear-gradient(45deg,var(--brand1),var(--brand2) 60%,var(--brand3));
  color:#0b0a12; cursor:pointer;
}
.text-danger{ color:#ff6b8a; font-size:13px; margin-top:4px; }
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<div class="auth-card">
  <div class="auth-head">RESET DEVICE LOCK</div>
  <div class="auth-body">
    <div class="status-wrap">
      <?= $this->include('Layout/msgStatus') ?>
    </div>

    <?= form_open(site_url('device-reset')) ?>
      <div>
        <label for="username" class="form-label">USERNAME</label>
        <input type="text" class="input-glass" id="username" name="username"
               placeholder="Enter your username" required>
      </div>
      <div>
        <label for="password" class="form-label">PASSWORD</label>
        <input type="password" class="input-glass" id="password" name="password"
               placeholder="Enter your password" required>
      </div>
      <button type="submit" class="btn-glass">RESET DEVICE</button>
    <?= form_close() ?>
  </div>
</div>
<?= $this->endSection() ?>