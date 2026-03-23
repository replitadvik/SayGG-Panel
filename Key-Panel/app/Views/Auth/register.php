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
  --navbar-h: 64px;         /* agar aapke top navbar ki height alag ho to yaha set karo */
}

body{
  background: linear-gradient(135deg,#667eea,#764ba2);
  font-family:'Poppins',sans-serif;
  min-height:100dvh;
  display:flex;align-items:flex-start;justify-content:center;
  color: white; /* This makes all text white */
}

/* TOP SE GAP – taaki card header ke niche na ghuse */
.glass-container{
  width:100%;
  margin:0 auto;
  padding: calc(var(--navbar-h) + 12px) 14px 16px; /* top gap = navbar height + 12px */
  display:flex;align-items:center;justify-content:center;
}

.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-radius: 16px;
  box-shadow: 0 8px 28px rgba(0,0,0,.28);
  width: 100%;          /* पहले 90% था → अब थोड़ा चौड़ा */
  max-width: 400px;    /* पहले 360px था → अब 400px किया */
  overflow: hidden;
  margin: 0 auto;
}

/* HEADER ko bhi tight karo */
.glass-header{
  display:flex; align-items:center; justify-content:center; gap:10px;
  padding:14px 12px;
  font-size:20px; font-weight:700; letter-spacing:1.2px;
  color:var(--text-color); text-transform:uppercase;
}

/* BODY padding kam, height compact */
.glass-body{ padding:14px; }

.glass-form-group{ margin-bottom:12px; position:relative; }
.glass-form-label{ color:var(--text-color); font-weight:600; margin-bottom:6px; font-size:12.5px; }

.glass-form-input{
  width:100%; padding:10px 12px; border:none; border-radius:12px;
  background:rgba(255,255,255,.10); color:var(--text-color);
  backdrop-filter:blur(10px); transition:.25s; padding-right:40px;
}
.glass-form-input::placeholder{ color:#e9e9e9; }
.glass-form-input:focus{ outline:none; background:rgba(255,255,255,.18);
  box-shadow:0 0 0 3px rgba(255,255,255,.28); }

.glass-eye-icon{
  position:absolute; right:12px; top:36px; cursor:pointer;
  color:var(--secondary-color);
}

.glass-btn{
  width:100%; padding:12px; border:none; border-radius:12px;
  background:linear-gradient(45deg,var(--primary-color),var(--secondary-color));
  color:#fff; font-weight:700; cursor:pointer; transition:.25s;
}
.glass-btn:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

.glass-login-text{ text-align:center; margin-top:12px; color:var(--text-color); font-size:13px; }
.glass-login-link{ color:var(--secondary-color); font-weight:700; text-decoration:none; }
.glass-login-link:hover{ text-decoration:underline; }

/* tiny phones ke liye aur tight */
@media (max-width:380px){
  .glass-card{ max-width:328px; border-radius:14px; }
  .glass-header{ font-size:18px; padding:12px; }
  .glass-body{ padding:12px; }
  .glass-form-input{ padding:9px 11px; font-size:13.5px; }
}

/* tablet par thoda wider but neat */
@media (min-width:768px){
  .glass-card{ max-width:420px; }
}
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<div class="glass-container">
    <div class="glass-card">
        <div class="glass-header">
            <i class="fas fa-user-plus"></i> SYSTEM REGISTRATION
        </div>
        <div class="glass-body">
            <?= $this->include('Layout/msgStatus') ?>

            <?= form_open() ?>
            
            <div class="glass-form-group">
                <label for="email" class="glass-form-label">E-MAIL</label>
                <input type="email" class="glass-form-input" name="email" id="email" placeholder="Enter your current mail" minlength="13" maxlength="40" value="<?= old('email') ?>" required>
                <?php if ($validation->hasError('email')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('email') ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="glass-form-group">
                <label for="username" class="glass-form-label">USERNAME</label>
                <input type="text" class="glass-form-input" name="username" id="username" placeholder="Your username" minlength="4" maxlength="24" value="<?= old('username') ?>" required>
                <?php if ($validation->hasError('username')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('username') ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="glass-form-group">
                <label for="fullname" class="glass-form-label">FULLNAME</label>
                <input type="text" class="glass-form-input" name="fullname" id="fullname" placeholder="Your fullname" minlength="4" maxlength="24" value="<?= old('fullname') ?>" required>
                <?php if ($validation->hasError('fullname')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('fullname') ?>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Add Telegram Chat ID Field -->
            <div class="glass-form-group">
                <label for="telegram_chat_id" class="glass-form-label">TELEGRAM CHAT ID</label>
                <input type="text" class="glass-form-input" name="telegram_chat_id" id="telegram_chat_id" placeholder="Your Telegram Chat ID" maxlength="20" value="<?= old('telegram_chat_id') ?>" required>
                <?php if ($validation->hasError('telegram_chat_id')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('telegram_chat_id') ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="glass-form-group">
                <label for="password" class="glass-form-label">PASSWORD</label>
                <input type="password" class="glass-form-input" name="password" id="password" placeholder="Enter password" minlength="6" maxlength="24" required>
                <i class="fas fa-eye glass-eye-icon toggle-password"></i>
                <?php if ($validation->hasError('password')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('password') ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="glass-form-group">
                <label for="password2" class="glass-form-label">CONFIRM PASSWORD</label>
                <input type="password" class="glass-form-input" name="password2" id="password2" placeholder="Confirm password" minlength="6" maxlength="24" required>
                <i class="fas fa-eye glass-eye-icon toggle-password2"></i>
                <?php if ($validation->hasError('password2')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('password2') ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="glass-form-group">
                <label for="referral" class="glass-form-label">REFERRAL CODE</label>
                <input type="text" class="glass-form-input" name="referral" id="referral" placeholder="Your referral code" maxlength="25" value="<?= old('referral') ?>" required>
                <?php if ($validation->hasError('referral')) : ?>
                    <div class="glass-form-error">
                        <i class="fas fa-exclamation-circle"></i>
                        <?= $validation->getError('referral') ?>
                    </div>
                <?php endif; ?>
            </div>

            <button type="submit" class="glass-btn" onclick="popup()">
                <i class="fas fa-user-plus"></i> REGISTER ACCOUNT
            </button>

            <?= form_close() ?>

            <p class="glass-login-text">
                ALREADY HAVE AN ACCOUNT? <a href="<?= site_url('login') ?>" class="glass-login-link">LOGIN HERE</a>
            </p>
        </div>
    </div>
</div>
<?= $this->endSection() ?>

<?= $this->section('js') ?>
<script>
    $(document).ready(function() {
        // Password toggle
        $(document).on('click', '.toggle-password', function() {
            $(this).toggleClass("fa-eye fa-eye-slash");
            let input = $("#password");
            input.attr('type') === 'password' ? input.attr('type','text') : input.attr('type','password');
        });

        $(document).on('click', '.toggle-password2', function() {
            $(this).toggleClass("fa-eye fa-eye-slash");
            let input = $("#password2");
            input.attr('type') === 'password' ? input.attr('type','text') : input.attr('type','password');
        });
    });

    function popup() {
        // Your popup code here
    }
</script>
<?= $this->endSection() ?>