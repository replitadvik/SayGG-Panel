<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>
<style>
  /* ========= GLASSMORPHISM DASHBOARD THEME ========= */
  :root{
    --glass-bg: rgba(255,255,255,.15);
    --glass-border: rgba(255,255,255,.30);
    --primary-color:#4facfe;
    --secondary-color:#00f2fe;
    --text-color:#ffffff;
    --navbar-h: 64px;
  }

  body{
    background: linear-gradient(135deg,#667eea,#764ba2);
    color: var(--text-color);
    font-family: 'Poppins',sans-serif;
    min-height: 100dvh;
  }

  .dashboard-container {
    width: 94%;
    max-width: 1100px;
    margin: 10px auto 16px;
  }

  /* GLASS cards */
  .card{
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 16px !important;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 28px rgba(0,0,0,.28);
    overflow: hidden;
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    margin-bottom: 22px;
    position: relative;
  }
  .card:hover{
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(0,0,0,.35);
    border-color: rgba(255,255,255,.45) !important;
  }

  .card-header{
    background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02)) !important;
    border-bottom: 1px solid var(--glass-border) !important;
    color: var(--text-color) !important;
    letter-spacing: .8px;
    padding: 14px 16px;
  }

  /* Compact + Glassy Inputs */
  .input-glass{
    background: rgba(255,255,255,.12) !important;
    border: 1px solid rgba(255,255,255,.28) !important;
    color: var(--text-color) !important;
    border-radius: 12px !important;
    height: 42px;
    padding: 8px 12px !important;
    box-shadow: inset 0 2px 8px rgba(0,0,0,.18);
    transition: border-color .2s, background .2s, box-shadow .2s, transform .08s;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }
  .input-glass:focus{
    outline: none;
    border-color: rgba(255,255,255,.5) !important;
    background: rgba(255,255,255,.16) !important;
    box-shadow: 0 0 0 3px rgba(79,172,254,.25), inset 0 2px 8px rgba(0,0,0,.22);
    transform: translateY(-1px);
  }
  .input-glass::placeholder{ color: rgba(255,255,255,.65); }

  .form-label{ margin-bottom: 6px; font-weight: 600; }

  /* Compact Primary Button */
  .btn-primary.btn-compact{
    --bs-btn-padding-y: .44rem;
    --bs-btn-padding-x: .9rem;
    --bs-btn-font-size: .95rem;
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(79,172,254,.25);
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    border: 1px solid rgba(255,255,255,.28);
  }
  .btn-primary.btn-compact:disabled{
    opacity: .85;
  }

  /* Fade in */
  .animate-in{ animation: fadeIn .5s ease-out forwards; opacity:0; }
  @keyframes fadeIn{ from{opacity:0; transform:translateY(16px)} to{opacity:1; transform:translateY(0)} }

  /* Alerts glassy tweak */
  .alert{
    border-radius: 12px;
    border: 1px solid var(--glass-border);
    background: rgba(255,255,255,.12);
    color: #fff;
  }

  @media (max-width: 991px){
    .dashboard-container{ width: 94%; max-width: 860px; }
  }
  @media (max-width: 768px){
    .dashboard-container{ width: 94%; }
  }
</style>

<?= $this->include('Layout/msgStatus') ?>

<div class="dashboard-container">
  <div class="card shadow-lg animate-in">
    <div class="card-header d-flex align-items-center gap-2">
      <i class="bi bi-key fs-5"></i>
      <h5 class="mb-0">License Change</h5>
    </div>

    <div class="card-body">
      <?php if(session()->getFlashdata('msgSuccess')): ?>
        <div class="alert alert-success mb-3"><?= session()->getFlashdata('msgSuccess') ?></div>
      <?php endif; ?>
      <?php if(session()->getFlashdata('msgDanger')): ?>
        <div class="alert alert-danger mb-3"><?= session()->getFlashdata('msgDanger') ?></div>
      <?php endif; ?>

      <?php if (!isset($user) || (int)$user->level !== 1): ?>
        <div class="alert alert-danger">Access Denied! Only Owner can change license.</div>
      <?php else: ?>
      <form method="post" action="<?= site_url('license') ?>" class="row g-3" id="licenseForm">
        <?= csrf_field() ?>

        <div class="col-12">
          <label class="form-label">Current License</label>
          <input type="text" class="form-control input-glass" value="<?= esc($current ?? '') ?>" readonly>
        </div>

        <div class="col-12">
          <label class="form-label">New License</label>
          <input type="text" name="license" class="form-control input-glass" placeholder="Enter new license string" minlength="8" maxlength="128" required>
          <div class="form-text">Allowed: letters, numbers, dash, underscore. Will be written into.</div>
        </div>

        <div class="col-12 d-flex justify-content-end">
          <button type="submit" class="btn btn-primary btn-compact" id="submitBtn">
            <i class="bi bi-save me-1"></i> Save Changes
          </button>
        </div>
      </form>
      <?php endif; ?>
    </div>
  </div>
</div>

<script>
(function(){
  var f = document.getElementById('licenseForm');
  var b = document.getElementById('submitBtn');
  if(!f||!b) return;
  f.addEventListener('submit', function(){
    b.disabled = true;
    b.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...';
  });
})();
</script>

<?= $this->endSection() ?>