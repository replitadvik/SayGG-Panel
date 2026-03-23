<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>

<style>
  /* ===== GLASSMORPHISM THEME – compact + wider sides ===== */
  :root{
    --glass-bg: rgba(255,255,255,.14);
    --glass-border: rgba(255,255,255,.30);
    --primary:#4facfe; 
    --secondary:#00f2fe;
    --text:#ffffff; 
    --muted:rgba(255,255,255,.75);
    --success:#32d296; 
    --danger:#ff6b6b;
    --ink:#0b0f1a;
  }
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

  /* Base */
  body{
    font-family:'Poppins',sans-serif; color:var(--text);
    background: radial-gradient(1200px 800px at 10% 10%, rgba(79,172,254,.18), transparent 35%),
                radial-gradient(1200px 800px at 90% 90%, rgba(0,242,254,.16), transparent 35%),
                linear-gradient(135deg,#667eea,#764ba2) fixed;
    min-height:100dvh; overflow-x:hidden;
  }
  .container-fluid{ padding-left:0; padding-right:0; }

  /* Card -> Glass panel */
  .cyber-card{
    background: var(--glass-bg);
    border:1px solid var(--glass-border);
    border-radius:12px;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,.25);
    overflow:hidden; margin-bottom:18px; transition:.25s;
  }
  .cyber-card:hover{
    transform: translateY(-2px);
    box-shadow: 0 12px 34px rgba(0,0,0,.35);
    border-color: rgba(255,255,255,.45);
  }

  /* Header -> Glass head */
  .cyber-header{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:14px 16px;
    background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
    border-bottom:1px solid var(--glass-border);
    font-weight:500; letter-spacing:.4px;
    color:#eafcff; text-shadow:0 0 8px rgba(0,242,255,.35);
  }

  /* Body */
  .cyber-body{ padding:16px; }

  /* Labels & Inputs -> Glass form controls */
  .cyber-label{ color:#eaeaff; font-weight:600; font-size:12.5px; margin-bottom:.5rem; display:block; }
  .cyber-input, .cyber-textarea, .cyber-form-select{
    width:100%; border:none !important; border-radius:10px !important;
    background: rgba(255,255,255,.10) !important; color:#fff !important;
    padding:11px 14px !important; transition:.25s;
  }
  .cyber-input::placeholder, .cyber-textarea::placeholder{ color:#e9e9e9 !important; opacity:.9; }
  .cyber-input:focus, .cyber-textarea:focus, .cyber-form-select:focus{
    background: rgba(255,255,255,.18) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,.25) !important; outline:none !important;
  }
  .cyber-textarea{ min-height:100px; resize:vertical; }

  /* Button -> Glass gradient btn */
  .cyber-btn{
    display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
    width:100%; border:none; border-radius:10px; padding:12px;
    font-weight:700; font-size:14px; letter-spacing:.5px; color:#fff;
    cursor:pointer; background: linear-gradient(45deg, var(--primary), var(--secondary));
    transition:.25s; text-transform:none;
  }
  .cyber-btn:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

  /* Info text */
  .status-text{ color:var(--muted); font-size:.9rem; }

  /* Alerts -> glass style */
  .alert{
    border:1px solid var(--glass-border);
    background: var(--glass-bg);
    backdrop-filter: blur(10px);
    color:#fff; border-radius:10px; padding:12px 14px; margin-bottom:16px;
  }
  .alert-success{ border-color:rgba(50,210,150,.45); color:#b9ffe7; }
  .alert-danger{ border-color:rgba(255,107,107,.45); color:#ffd1d1; }

  /* Optional: small scanline overlay on cards */
  .cyber-card::before{
    content:""; position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
    background-size:100% 4px; opacity:.18;
  }
</style>

<div class="row">
  <div class="col-lg-12">
    <?= $this->include('Layout/msgStatus') ?>
  </div>

  <?php if($user->level == 1) : ?>
  <div class="col-lg-6 mx-auto">
    <div class="cyber-card">
      <div class="cyber-header">
        <span>Change Panel Name</span>
      </div>
      <div class="cyber-body">
        <?= form_open('settings/updateSiteName') ?>
          <div class="form-group mb-3">
            <label for="base_name" class="cyber-label">Website Name</label>
            <input
              type="text"
              name="base_name"
              id="base_name"
              class="cyber-input"
              value="<?= esc(defined('BASE_NAME') ? BASE_NAME : 'My Site') ?>"
              placeholder="Enter your site name"
            >
            <?php if ($validation->hasError('base_name')) : ?>
              <small class="text-danger"><?= $validation->getError('base_name') ?></small>
            <?php endif; ?>
          </div>

          <div class="form-group my-2">
            <button type="submit" class="cyber-btn">Update Site Name</button>
          </div>
        <?= form_close() ?>
      </div>
    </div>
  </div>
  <?php endif; ?>
</div>

<?= $this->endSection() ?>