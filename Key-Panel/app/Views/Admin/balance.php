<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>
<style>
  /* ========= GLASSMORPHISM DASHBOARD THEME (matches Login/Register #1) ========= */
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

  /* ====== NEW: Compact + Glassy Inputs ====== */
  .input-glass{
    background: rgba(255,255,255,.12) !important;
    border: 1px solid rgba(255,255,255,.28) !important;
    color: var(--text-color) !important;
    border-radius: 12px !important;
    height: 42px;                      /* smaller than -lg */
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

  /* compact labels */
  .form-label{ margin-bottom: 6px; font-weight: 600; }

  /* ====== NEW: Compact Primary Button (smaller) ====== */
  .btn-primary.btn-compact{
    --bs-btn-padding-y: .44rem;  /* smaller height */
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

  .card::before{ content:none; }

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
      <i class="bi bi-cash-coin fs-5"></i>
      <h5 class="mb-0">Add Balance</h5>
    </div>

    <div class="card-body">

      <?php if(session()->getFlashdata('msgSuccess')): ?>
        <div class="alert alert-success mb-3"><?= session()->getFlashdata('msgSuccess') ?></div>
      <?php endif; ?>
      <?php if(session()->getFlashdata('msgDanger')): ?>
        <div class="alert alert-danger mb-3"><?= session()->getFlashdata('msgDanger') ?></div>
      <?php endif; ?>

      <form method="post" action="<?= site_url('balance') ?>" class="row g-3" id="balanceForm">
        <?= csrf_field() ?>

        <!-- USER SELECT: only username + current balance -->
        <div class="col-12">
          <label class="form-label">Select User</label>
          <!-- NOTE: removed form-select-lg, added input-glass for compact + glassy -->
          <select name="user_id" class="form-select input-glass" required>
            <option value="" disabled selected>Choose user…</option>
            <?php foreach($users as $u): ?>
              <option value="<?= esc($u->id_users) ?>">
                <?= esc($u->username) ?> — <?= esc($u->saldo) ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>

        <!-- AMOUNT -->
        <div class="col-12 col-md-6">
          <label class="form-label">Amount to Add</label>
          <!-- NOTE: removed form-control-lg, added input-glass for compact + glassy -->
          <input type="number" name="amount" class="form-control input-glass" placeholder="100" min="1" step="1" required>
        </div>

        <div class="col-12 d-flex justify-content-end">
          <!-- NOTE: compact button class -->
          <button type="submit" class="btn btn-primary btn-compact" id="submitBtn">
            <i class="bi bi-plus-circle me-1"></i>
            Add Balance
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- One-time click: disable on submit to prevent double post -->
<script>
(function() { 
  var form = document.getElementById('balanceForm');
  var btn  = document.getElementById('submitBtn');
  if (!form || !btn) return;
  form.addEventListener('submit', function(){
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Processing...';
  });
})();
</script>

<?= $this->endSection() ?>