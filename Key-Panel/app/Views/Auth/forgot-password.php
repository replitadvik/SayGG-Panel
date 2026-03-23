<?= $this->extend('Layout/Starter') ?>

<?= $this->section('css') ?>
<style>
/* GLASSMORPHISM – COMPACT + SAFE SPACING */
:root{
  --glass-bg: rgba(255,255,255,.15);
  --glass-border: rgba(255,255,255,.30);
  --primary-color:#4facfe;
  --secondary-color:#00f2fe;
  --text-color:#fff;
  --navbar-h: 64px;
}

body{
  background: linear-gradient(135deg,#667eea,#764ba2);
  font-family:'Poppins',sans-serif;
  min-height:100dvh;
  display:flex;align-items:flex-start;justify-content:center;
  color: white;
}

.glass-container{
  width:100%;
  margin:0 auto;
  padding: calc(var(--navbar-h) + 12px) 14px 16px;
  display:flex;align-items:center;justify-content:center;
}

.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0,0,0,.28);
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  margin: 0 auto;
}

.glass-header{
  display:flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 12px;
  font-size:20px; font-weight:700; letter-spacing:1.2px;
  color:var(--text-color); text-transform:uppercase;
}

.glass-body{ padding:14px; }

.glass-form-group{ margin-bottom:12px; position:relative; }
.glass-form-label{ color:var(--text-color); font-weight:600; margin-bottom:6px; font-size:12.5px; }

.glass-form-input{
  width:100%; padding:10px 12px; border:none; border-radius:12px;
  background:rgba(255,255,255,.10); color:var(--text-color);
  backdrop-filter:blur(10px); transition:.25s;
}
.glass-form-input::placeholder{ color:#e9e9e9; }
.glass-form-input:focus{ outline:none; background:rgba(255,255,255,.18);
  box-shadow:0 0 0 3px rgba(255,255,255,.28); }

.glass-btn{
  width:100%; padding:12px; border:none; border-radius:12px;
  background:linear-gradient(45deg,var(--primary-color),var(--secondary-color));
  color:#fff; font-weight:700; cursor:pointer; transition:.25s;
}
.glass-btn:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

.glass-login-text{ text-align:center; margin-top:12px; color:var(--text-color); font-size:13px; }
.glass-login-link{ color:var(--secondary-color); font-weight:700; text-decoration:none; }
.glass-login-link:hover{ text-decoration:underline; }

.glass-help-text{
  font-size: 12px;
  opacity: .75;
  margin-top: 16px;
  line-height: 1.5;
  padding: 12px;
  background: rgba(255,255,255,.08);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.15);
  text-align: center;
}

@media (max-width:380px){
  .glass-card{ max-width:328px; border-radius:14px; }
  .glass-header{ font-size:18px; padding:12px; }
  .glass-body{ padding:12px; }
  .glass-form-input{ padding:9px 11px; font-size:13.5px; }
}

@media (min-width:768px){
  .glass-card{ max-width:420px; }
}
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<div class="glass-container">
    <div class="glass-card">
        <div class="glass-header">
            <i class="fas fa-key"></i> FORGOT PASSWORD
        </div>
        <div class="glass-body">
            <?= $this->include('Layout/msgStatus') ?>

            <?= form_open('forgot-password') ?>
            
            <div class="glass-form-group">
                <label for="username" class="glass-form-label">USERNAME</label>
                <input type="text" class="glass-form-input" name="username" id="username" placeholder="Enter your username" minlength="4" maxlength="24" value="<?= old('username') ?>" required>
                <?php if ($validation->hasError('username')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('username') ?>
                    </div>
                <?php endif; ?>
            </div>

            <button type="submit" class="glass-btn">
                <i class="fas fa-paper-plane"></i> SEND OTP TO TELEGRAM
            </button>

            <?= form_close() ?>

            <div class="glass-help-text">
                <i class="fas fa-info-circle"></i>
                We'll send a 6-digit OTP to your registered Telegram account to reset your password.
            </div>

            <p class="glass-login-text">
                REMEMBER YOUR PASSWORD? <a href="<?= site_url('login') ?>" class="glass-login-link">LOGIN HERE</a>
            </p>
        </div>
    </div>
</div>
<?= $this->endSection() ?>