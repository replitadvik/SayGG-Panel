<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>
<style>
/* ====== GLASSMORPHISM THEME – Compact, Wider Sides (Desktop 98%, Mobile 99%) ====== */

/* fonts (optional) */
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
  --navbar-h:64px; /* top navbar height */
}

/* remove unwanted top gap between extend() and section() */
.glass-page {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

/* base */
body{
  font-family:'Poppins',sans-serif;
  color:var(--text);
  background: linear-gradient(135deg,#667eea,#764ba2) fixed;
  min-height:100dvh;
}

/* only status message (agar kahin use ho) */
.status-message{ margin-bottom:16px; color:var(--text); font-size:14px; }

/* page container – side gap kam */
.glass-page,
.cyber-dashboard{
  width:98%;
  max-width:1200px;
  margin: calc(var(--navbar-h) + 10px) auto 20px;
  padding:0;
}

/* grid layout */
.glass-grid{ display:grid; grid-template-columns:1fr; gap:14px; }
@media (min-width:992px){ .glass-grid{ grid-template-columns:1.1fr .9fr; } }

/* panels/cards */
.glass-panel,
.cyber-card{
  background: var(--glass-bg);
  border:1px solid var(--glass-border);
  border-radius:12px;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow:0 8px 24px rgba(0,0,0,.25);
  overflow:hidden;
  transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
  padding:18px;
  margin-bottom:20px;
}
.glass-panel:hover,
.cyber-card:hover{
  transform: translateY(-2px);
  box-shadow:0 12px 34px rgba(0,0,0,.35);
  border-color: rgba(255,255,255,.45);
}

/* panel header - COMPACT VERSION */
.glass-head,
.cyber-header{
  display:flex; align-items:center; gap:10px;
  padding:10px 16px;
  background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
  border-bottom:1px solid var(--glass-border);
  margin-bottom: 10px;
}
.glass-head h3,
.cyber-header h3{ margin:0; font-size:16px; font-weight:700; letter-spacing:.4px; }

/* body */
.glass-body,
.cyber-body{ padding:10px 14px; }

/* form fields */
.g-group,
.cyber-form-group{ margin-bottom:12px; position:relative; }

.g-label,
.cyber-label{
  display:block; margin-bottom:6px; color:#eaeaff; font-weight:600; font-size:12.5px;
}

.g-input,
.cyber-input{
  width:100%;
  border:none; border-radius:8px;
  background: rgba(255,255,255,.10);
  color:#fff;
  padding:11px 14px; padding-right:40px;
  font-size:14px; line-height:1.25;
  backdrop-filter: blur(10px);
  transition:.25s;
}
.g-input::placeholder,
.cyber-input::placeholder{ color:#e9e9e9; opacity:.9; }
.g-input:focus,
.cyber-input:focus{
  outline:none; background:rgba(255,255,255,.18);
  box-shadow:0 0 0 3px rgba(255,255,255,.25);
}

/* eye icon for password */
.eye,
.password-toggle{
  position:absolute; right:12px; top:36px; cursor:pointer;
  color:var(--secondary);
}

/* error text */
.g-error,
.cyber-error{
  color:#ff6b6b; font-size:12px; margin-top:6px;
  display:flex; align-items:center; gap:6px;
}

/* buttons */
.g-btn,
.cyber-btn{
  width:100%;
  border:none; border-radius:8px;
  padding:12px;
  font-weight:600; font-size:14px; letter-spacing:.5px;
  color:#fff; cursor:pointer;
  background: linear-gradient(45deg, var(--primary), var(--secondary));
  transition: all .3s ease;
  display:flex; align-items:center; justify-content:center; gap:8px;
}
.g-btn.pink{ background: linear-gradient(45deg, var(--pink), var(--purple)); }
.g-btn:hover,
.cyber-btn:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

/* toast/status style */
.alert, .toast, .badge{
  border-radius:10px; backdrop-filter: blur(10px);
}

/* Additional styles for 2FA page */
.row-actions{ display:flex; gap:10px; align-items:center; margin-top:10px; }

/* Toggle (switch) */
.switch{ position:relative; display:inline-block; width:56px; height:32px; }
.switch input{ opacity:0; width:0; height:0; }
.slider{ position:absolute; cursor:pointer; inset:0; background:rgba(255,255,255,.25);
  transition:.25s; border-radius:999px; }
.slider:before{ content:""; position:absolute; height:24px; width:24px; left:4px; top:4px;
  background:#fff; border-radius:50%; transition:.25s; }
.switch input:checked + .slider{ background:linear-gradient(45deg,var(--primary),var(--secondary)); }
.switch input:checked + .slider:before{ transform:translateX(24px); }
.switch input:disabled + .slider{ opacity:.5; cursor:not-allowed; }
.hint{ font-size:12px; opacity:.8; margin-top:6px; }

/* COMPACT LAYOUT FOR 2FA SECTION */
.compact-toggle-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 5px 0;
}

/* tiny phones: almost full width */
@media (max-width:768px){
  .glass-page, .cyber-dashboard{ width:99%; }
  .glass-head h3, .cyber-header h3{ font-size:16px; }
  .row-actions { flex-direction: column; }
  .g-btn { width: 100%; }
  .compact-toggle-section { flex-direction: column; align-items: flex-start; }
}
</style>

<?= $this->include('Layout/msgStatus') ?>

<div class="glass-page">

  <!-- 2FA Toggle - COMPACT VERSION -->
  <div class="glass-panel">
    <div class="glass-head">
      <i class="fas fa-lock"></i>
      <h3>Two-Factor Authentication</h3>
    </div>
    <div class="glass-body">
      <form method="post" action="<?= site_url('user/toggle-twofa') ?>" id="twofa-form">
        <?= function_exists('csrf_field') ? csrf_field() : '' ?>
        
        <div class="compact-toggle-section">
          <div>
            <label class="g-label">TWO-STEP VERIFICATION</label>
            <div class="hint"><?= empty($chatId) ? 'You need to set your Chat ID first to enable 2FA.' : 'Toggle to instantly enable or disable 2FA.' ?></div>
          </div>

          <!-- TOGGLE SWITCH -->
          <label class="switch" title="<?= empty($chatId) ? 'Add Chat ID first' : '' ?>">
            <input type="checkbox" name="twofa" id="twofa_switch"
                   <?= !empty($twofaOn) ? 'checked' : '' ?> <?= empty($chatId) ? 'disabled' : '' ?>>
            <span class="slider"></span>
          </label>
        </div>
        <input type="hidden" name="twofa_form" value="1">
      </form>
    </div>
  </div>

  <!-- Telegram Chat ID -->
  <div class="glass-panel">
    <div class="glass-head">
      <i class="fab fa-telegram-plane"></i>
      <h3>Telegram Chat ID</h3>
    </div>
    <div class="glass-body">
      <form method="post" action="<?= site_url('user/update-telegram-chat-id') ?>">
        <?= function_exists('csrf_field') ? csrf_field() : '' ?>
        
        <div class="g-group">
          <label for="telegram_chat_id" class="g-label">TELEGRAM CHAT ID</label>
          <input type="text" class="g-input" name="new_telegram_chat_id" id="telegram_chat_id"
                 value="<?= esc($chatId ?? '') ?>" placeholder="e.g. 123456789">
          <div class="hint">Make sure to start the bot first. Use @userinfobot to find your Chat ID.</div>
        </div>

        <div class="row-actions">
          <button class="g-btn" type="submit" id="btn-chatid-save">
            <i class="fab fa-telegram"></i> Update Chat ID
          </button>
          <?php if(!empty($chatId)): ?>
          <button class="g-btn pink" type="submit" name="new_telegram_chat_id" value="">
            <i class="fas fa-trash-alt"></i> Remove
          </button>
          <?php endif; ?>
        </div>

        <div style="margin-top: 16px;">
          <a href="https://t.me/Panelauthentication_bot" target="_blank" class="g-btn" style="text-decoration: none;">
            <i class="fab fa-telegram"></i> Open Bot
          </a>
        </div>
      </form>
    </div>
  </div>
</div>

<?= $this->endSection() ?>

<?= $this->section('js') ?>
<script>
  // Chat ID save spinner
  const btn = document.getElementById('btn-chatid-save');
  if (btn) {
    btn.closest('form').addEventListener('submit', function(){
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    });
  }

  // Toggle auto-submit
  const tf = document.getElementById('twofa-form');
  const sw = document.getElementById('twofa_switch');
  if (tf && sw) {
    sw.addEventListener('change', function(){
      const i = document.createElement('input');
      i.type = 'hidden';
      i.name = 'twofa';
      i.value = this.checked ? 'on' : 'off';
      tf.appendChild(i);
      tf.submit();
    });
  }

  // Glass Toast (flashdata success/error/info)
  document.addEventListener('DOMContentLoaded', function(){
    const successMsg = <?= json_encode(session('success') ?? '') ?>;
    const errorMsg   = <?= json_encode(session('error') ?? '') ?>;
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
      if (type === 'error')   el.style.background = 'linear-gradient(45deg, #ff5252, #ff1744)';
      if (type === 'info')    el.style.background = 'linear-gradient(45deg, #4facfe, #00f2fe)';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(()=>{ el.style.transition='opacity .4s'; el.style.opacity='0'; }, 2000);
      setTimeout(()=>{ el.remove(); }, 2600);
    }

    if (successMsg) showToast(successMsg, 'success');
    if (errorMsg)   showToast(errorMsg,   'error');
    if (infoMsg)    showToast(infoMsg,    'info');
  });
</script>
<?= $this->endSection() ?>