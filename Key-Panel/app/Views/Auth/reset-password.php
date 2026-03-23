<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>
<style>
/* ====== GLASSMORPHISM THEME – Compact, Wider Sides ====== */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

:root{
  --glass-bg: rgba(255,255,255,.14);
  --glass-border: rgba(255,255,255,.30);
  --primary:#4facfe;
  --secondary:#00f2fe;
  --pink:#ff66e9;
  --purple:#7d5cff;
  --text:#ffffff;
  --muted:rgba(255,255,255,.70);
  --navbar-h:64px;
}

body{
  font-family:'Poppins',sans-serif;
  color:var(--text);
  background: linear-gradient(135deg,#667eea,#764ba2) fixed;
  min-height:100dvh;
}

.reset-card{
  max-width:420px;
  margin: 80px auto;
  padding: 28px;
  border-radius: 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 12px 32px rgba(0,0,0,.35);
  color: var(--text);
  text-align: center;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
}

.reset-card:hover{
  transform: translateY(-2px);
  box-shadow: 0 16px 40px rgba(0,0,0,.45);
  border-color: rgba(255,255,255,.45);
}

.reset-card h2{
  margin: 0 0 14px 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: .4px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.reset-card p{
  opacity: .85;
  margin: 0 0 20px 0;
  font-size: 14px;
  line-height: 1.5;
}

.reset-card form{
  margin-bottom: 16px;
}

.reset-form-group{
  margin-bottom: 16px;
  text-align: left;
}

.reset-form-label{
  color: var(--text);
  font-weight: 600;
  margin-bottom: 6px;
  font-size: 12.5px;
  display: block;
}

.reset-form-input{
  width: 100%;
  padding: 14px 16px;
  border-radius: 10px;
  border: none;
  background: rgba(255,255,255,.12);
  color: var(--text);
  font-size: 16px;
  backdrop-filter: blur(10px);
  transition: .25s;
  outline: none;
  box-sizing: border-box;
}

.reset-form-input::placeholder{
  color: #e9e9e9;
  opacity: .8;
}

.reset-form-input:focus{
  background: rgba(255,255,255,.18);
  box-shadow: 0 0 0 3px rgba(255,255,255,.25);
}

.otp-input{
  text-align: center;
  font-weight: 600;
  letter-spacing: 8px;
  font-size: 18px;
}

.reset-card button{
  width: 100%;
  margin-top: 18px;
  padding: 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(45deg, var(--primary), var(--secondary));
  color: #fff;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: .5px;
  cursor: pointer;
  transition: all .3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.reset-card button:hover{
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,.35);
}

.reset-error{
  background: linear-gradient(45deg, #ff5252, #ff1744);
  color: #fff;
  padding: 12px 16px;
  border-radius: 10px;
  margin: 16px 0;
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,.2);
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.reset-help{
  font-size: 12px;
  opacity: .75;
  margin-top: 16px;
  line-height: 1.5;
  padding: 12px;
  background: rgba(255,255,255,.08);
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,.15);
}

.password-toggle{
  position: absolute;
  right: 12px;
  top: 38px;
  cursor: pointer;
  color: var(--secondary);
}

.password-group{
  position: relative;
}

@media (max-width: 480px){
  .reset-card{
    margin: 60px 16px;
    padding: 24px 20px;
    width: auto;
  }
  
  .reset-card h2{
    font-size: 20px;
  }
  
  .reset-form-input{
    padding: 12px 14px;
    font-size: 15px;
  }
  
  .otp-input{
    font-size: 16px;
    letter-spacing: 6px;
  }
}
</style>
<?= $this->include('Layout/msgStatus') ?>
<div class="reset-card">
  <h2>
    <i class="fas fa-key"></i>
    Reset Password
  </h2>
  <p>Enter the OTP sent to your Telegram and set your new password.</p>
  
  <!-- Error Message Display -->
  <?php if (session()->getFlashdata('error')): ?>
    <div class="reset-error">
      <i class="fas fa-exclamation-triangle"></i>
      <?= session()->getFlashdata('error') ?>
    </div>
  <?php endif; ?>
  
  <?= form_open('reset-password') ?>
    <div class="reset-form-group">
      <label for="otp" class="reset-form-label">OTP CODE</label>
      <input type="text" name="otp" id="otp" class="reset-form-input otp-input" 
             placeholder="000000" maxlength="6" pattern="\d{6}" required 
             inputmode="numeric" autocomplete="one-time-code"
             value="<?= old('otp') ?>">
    </div>

    <div class="reset-form-group password-group">
      <label for="new_password" class="reset-form-label">NEW PASSWORD</label>
      <input type="password" name="new_password" id="new_password" 
             class="reset-form-input" placeholder="Enter new password" 
             minlength="6" maxlength="45" required>
      <i class="fas fa-eye password-toggle toggle-password"></i>
    </div>

    <div class="reset-form-group password-group">
      <label for="confirm_password" class="reset-form-label">CONFIRM PASSWORD</label>
      <input type="password" name="confirm_password" id="confirm_password" 
             class="reset-form-input" placeholder="Confirm new password" 
             minlength="6" maxlength="45" required>
      <i class="fas fa-eye password-toggle toggle-confirm-password"></i>
    </div>

    <button type="submit">
      <i class="fas fa-check-circle"></i>
      Reset Password
    </button>
  <?= form_close() ?>

  <div class="reset-help">
    OTP expires in 5 minutes. Make sure your new password is strong and memorable.
  </div>
</div>
<?= $this->endSection() ?>

<?= $this->section('js') ?>
<script>
// Auto-focus on OTP input
document.addEventListener('DOMContentLoaded', function() {
  const otpInput = document.querySelector('input[name="otp"]');
  if (otpInput) {
    otpInput.focus();
    
    <?php if (session()->getFlashdata('error')): ?>
      otpInput.value = '';
      otpInput.focus();
    <?php endif; ?>
  }

  // Password toggle functionality
  const togglePassword = document.querySelector('.toggle-password');
  const toggleConfirm = document.querySelector('.toggle-confirm-password');
  const newPassword = document.getElementById('new_password');
  const confirmPassword = document.getElementById('confirm_password');

  if (togglePassword && newPassword) {
    togglePassword.addEventListener('click', function() {
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
      newPassword.type = newPassword.type === 'password' ? 'text' : 'password';
    });
  }

  if (toggleConfirm && confirmPassword) {
    toggleConfirm.addEventListener('click', function() {
      this.classList.toggle("fa-eye");
      this.classList.toggle("fa-eye-slash");
      confirmPassword.type = confirmPassword.type === 'password' ? 'text' : 'password';
    });
  }
});

// Toast notifications
document.addEventListener('DOMContentLoaded', function(){
  const successMsg = <?= json_encode(session('success') ?? '') ?>;
  const infoMsg    = <?= json_encode(session('info') ?? '') ?>;

  function showToast(msg, type='success') {
    if(!msg) return;
    const el = document.createElement('div');
    el.style.position = 'fixed';
    el.style.right = '16px';
    el.style.bottom = '16px';
    el.style.zIndex = '9999';
    el.style.padding = '12px 14px';
    el.style.borderRadius = '10px';
    el.style.backdropFilter = 'blur(10px)';
    el.style.webkitBackdropFilter = 'blur(10px)';
    el.style.boxShadow = '0 8px 24px rgba(0,0,0,.25)';
    el.style.color = '#fff';
    el.style.maxWidth = '80vw';
    el.style.fontWeight = '600';
    el.style.letterSpacing = '.2px';
    if (type === 'success') el.style.background = 'linear-gradient(45deg, #00c853, #64dd17)';
    if (type === 'info')    el.style.background = 'linear-gradient(45deg, #4facfe, #00f2fe)';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; }, 3000);
    setTimeout(()=>{ el.remove(); }, 3600);
  }

  if (successMsg) showToast(successMsg, 'success');
  if (infoMsg)    showToast(infoMsg, 'info');
});
</script>
<?= $this->endSection() ?> 