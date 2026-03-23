<?= $this->extend('Layout/Starter') ?>
<?= $this->section('content') ?>

<style>
  :root{
    --glass-bg: rgba(255,255,255,.15);
    --glass-border: rgba(255,255,255,.30);
    --primary-color:#4facfe;
    --secondary-color:#00f2fe;
    --text-color:#ffffff;
  }

  body{
    background: linear-gradient(135deg,#667eea,#764ba2);
    color: var(--text-color);
    font-family: 'Poppins',sans-serif;
    min-height: 100dvh;
  }

  .dashboard-container { width: 94%; max-width: 1200px; margin: 16px auto; }

  .card{
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    border-radius: 16px !important;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 8px 28px rgba(0,0,0,.28);
    overflow: hidden;
    transition: transform .25s ease, box-shadow .25s ease, border-color .25s ease;
    margin-bottom: 26px;
    position: relative;
  }
  .card:hover{ transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,.35); border-color: rgba(255,255,255,.45) !important; }

  .card-header{
    background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02)) !important;
    border-bottom: 1px solid var(--glass-border) !important;
    color: var(--text-color) !important;
    letter-spacing: .8px;
    padding: 12px 16px;
  }

  .row { row-gap: 18px; }

  /* New UI Elements from Dashboard */
  .stat-card{ text-align:center; padding: 16px; }
  .stat-icon{ font-size: 1.8rem; margin-bottom: 10px; color: var(--secondary-color); }
  .stat-value{
    font-size: 1.7rem; font-weight: 800; margin-bottom: 2px;
    background: linear-gradient(45deg,var(--primary-color),var(--secondary-color));
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
  }
  .stat-label{ font-size:.9rem; opacity:.92; letter-spacing:.4px; }

  .list-group-item{
    background: rgba(255,255,255,.08) !important;
    border: 1px solid var(--glass-border) !important;
    color: var(--text-color) !important;
    transition: background .2s, transform .2s, border-color .2s;
    margin-bottom: 6px; border-radius: 10px !important;
  }
  .list-group-item:hover{ background: rgba(255,255,255,.14) !important; transform: translateX(4px); border-color: rgba(255,255,255,.45) !important; }
  .badge{
    padding: 7px 12px; border-radius: 999px;
    background: rgba(255,255,255,.10) !important; border: 1px solid var(--glass-border) !important;
    font-weight: 600; font-size: .82rem; color: var(--text-color) !important;
  }
  .muted{ opacity:.85; font-size:.9rem; }
  
  /* Form Styling Improvements */
  .form-control, .form-select {
    background: rgba(255,255,255,.1) !important;
    border: 1px solid var(--glass-border) !important;
    color: var(--text-color) !important;
    border-radius: 10px;
  }
  .form-control:focus, .form-select:focus {
    background: rgba(255,255,255,.15) !important;
    border-color: var(--secondary-color) !important;
    box-shadow: 0 0 0 0.2rem rgba(0, 242, 254, 0.25);
    color: var(--text-color) !important;
  }
  .form-control::placeholder {
    color: rgba(255,255,255,.7) !important;
  }
  
  /* Button Improvements */
  .btn {
    border-radius: 10px;
    transition: all 0.3s ease;
  }
  .btn-primary {
    background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
    border: none;
  }
  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  }
  
  /* Animation Classes */
  .animate-in {
    animation: fadeInUp 0.6s ease forwards;
    opacity: 0;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

<?= $this->include('Layout/msgStatus') ?>
<div class="dashboard-container">
  <!-- Alerts with Dashboard Styling -->
  <?php if (session()->getFlashdata('msg')): ?>
    <div class="alert alert-success mb-3 animate-in" style="animation-delay: 0.1s"><?= esc(session()->getFlashdata('msg')) ?></div>
  <?php endif; ?>
  <?php if (session()->getFlashdata('err')): ?>
    <div class="alert alert-danger mb-3 animate-in" style="animation-delay: 0.1s"><?= esc(session()->getFlashdata('err')) ?></div>
  <?php endif; ?>

  <!-- Stats Overview Cards - New Addition from Dashboard -->
  <div class="row mb-4">
    <div class="col-md-3 col-sm-6 animate-in" style="animation-delay: 0.2s">
      <div class="card">
        <div class="card-body stat-card">
          <div class="stat-icon">
            <i class="bi bi-clock-history"></i>
          </div>
          <div class="stat-value"><?= count($overrides ?? []) ?></div>
          <div class="stat-label">Active Durations</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6 animate-in" style="animation-delay: 0.3s">
      <div class="card">
        <div class="card-body stat-card">
          <div class="stat-icon">
            <i class="bi bi-currency-rupee"></i>
          </div>
          <div class="stat-value">
            <?php 
              if (!empty($overrides)) {
                $total = array_sum($overrides);
                echo "₹" . $total;
              } else {
                echo "₹0";
              }
            ?>
          </div>
          <div class="stat-label">Total Price Value</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6 animate-in" style="animation-delay: 0.4s">
      <div class="card">
        <div class="card-body stat-card">
          <div class="stat-icon">
            <i class="bi bi-graph-up"></i>
          </div>
          <div class="stat-value">
            <?php 
              if (!empty($overrides)) {
                $avg = array_sum($overrides) / count($overrides);
                echo "₹" . round($avg, 2);
              } else {
                echo "₹0";
              }
            ?>
          </div>
          <div class="stat-label">Average Price</div>
        </div>
      </div>
    </div>
    <div class="col-md-3 col-sm-6 animate-in" style="animation-delay: 0.5s">
      <div class="card">
        <div class="card-body stat-card">
          <div class="stat-icon">
            <i class="bi bi-list-check"></i>
          </div>
          <div class="stat-value">
            <?= !empty($durations) ? count($durations) : '0' ?>
          </div>
          <div class="stat-label">Available Options</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Controls -->
  <div class="card animate-in" style="animation-delay: 0.6s">
    <div class="card-header d-flex align-items-center justify-content-between">
      <h5 class="m-0"><i class="bi bi-currency-exchange me-2"></i>Price & Duration Controls</h5>
      <a href="<?= site_url('keys/generate') ?>" class="btn btn-outline-light btn-sm"><i class="bi bi-key me-1"></i>Go to Generate</a>
    </div>
    <div class="card-body">
      <div class="row">
        <!-- ADD DURATION -->
        <div class="col-lg-6">
          <h6 class="mb-3"><i class="bi bi-plus-circle me-1"></i>Add / Activate Duration</h6>
          <form method="post" action="<?= site_url('price/add') ?>" class="row g-3">
            <?= csrf_field() ?>
            <div class="col-md-6">
              <label for="new_duration" class="form-label">New Duration (Hours)</label>
              <input type="number" id="new_duration" name="duration" min="1" class="form-control" placeholder="e.g. 24" required>
              <div class="form-text muted">Example: 24 (1 day), 72 (3 days), 720 (1 month)</div>
            </div>
            <div class="col-md-6">
              <label for="new_price" class="form-label">Price (₹/Device)</label>
              <input type="number" id="new_price" name="price" min="1" class="form-control" placeholder="e.g. 150" required>
            </div>
            <div class="col-12">
              <button type="submit" class="btn btn-primary w-100">
                <i class="bi bi-save me-1"></i>Add / Activate
              </button>
            </div>
          </form>
        </div>

        <!-- UPDATE PRICE -->
        <div class="col-lg-6">
          <h6 class="mb-3"><i class="bi bi-pencil-square me-1"></i>Update Price (Active Durations)</h6>
          <?php if (!empty($durations)): ?>
            <form method="post" action="<?= site_url('price/update') ?>" class="row g-3" id="updateForm">
              <?= csrf_field() ?>
              <div class="col-md-6">
                <label for="duration" class="form-label">Select Duration</label>
                <select id="duration" name="duration" class="form-select" required>
                  <?php foreach ($durations as $d): ?>
                    <option value="<?= $d ?>">
                      <?php
                        $label = $d < 24
                          ? "{$d} Hours"
                          : ($d % 720 === 0
                              ? ($d/720) . " Months"
                              : ($d % 24 === 0 ? ($d/24) . " Days" : "{$d} Hours"));
                        if ($d === 1) $label = "1 Hours Trail";
                        if ($d === 2) $label = "2 Hours Trail";
                        echo $label;
                      ?>
                    </option>
                  <?php endforeach; ?>
                </select>
                <div class="form-text muted" id="currentPriceHelp">Current: —</div>
              </div>
              <div class="col-md-6">
                <label for="price" class="form-label">Enter New Price (₹/Device)</label>
                <input type="number" id="price" name="price" min="1" class="form-control" placeholder="e.g. 1200" required>
              </div>
              <div class="col-12 d-flex gap-2">
                <button type="submit" class="btn btn-primary"><i class="bi bi-save me-1"></i>Update Price</button>
              </div>
            </form>
          <?php else: ?>
            <div class="alert alert-warning">No active durations found. Please add a duration first.</div>
          <?php endif; ?>
        </div>
      </div>
    </div>
  </div>

  <!-- CURRENT DURATIONS (ACTIVE) -->
  <?php if (!empty($overrides)): ?>
    <div class="card animate-in" style="animation-delay: 0.7s">
      <div class="card-header d-flex align-items-center justify-content-between">
        <h6 class="m-0"><i class="bi bi-list-ul me-2"></i>Active Durations & Prices</h6>
        <span class="muted">Only active durations are shown here</span>
      </div>
      <ul class="list-group list-group-flush">
        <?php foreach ($overrides as $d => $p): ?>
          <li class="list-group-item d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center gap-3">
              <span class="badge">
                <?php
                  $label = $d < 24
                    ? "{$d} Hours"
                    : ($d % 720 === 0
                        ? ($d/720) . " Months"
                        : ($d % 24 === 0 ? ($d/24) . " Days" : "{$d} Hours"));
                  if ($d === 1) $label = "1 Hours Trail";
                  if ($d === 2) $label = "2 Hours Trail";
                  echo $label;
                ?>
              </span>
              <strong>₹ <?= esc($p) ?></strong>
            </div>
            <form method="post" action="<?= site_url('price/delete/'.$d) ?>" onsubmit="return confirm('Remove this duration? It will be hidden from selection.');">
              <?= csrf_field() ?>
              <button class="btn btn-sm btn-outline-danger"><i class="bi bi-trash me-1"></i>Remove</button>
            </form>
          </li>
        <?php endforeach; ?>
      </ul>
    </div>
  <?php endif; ?>
</div>

<script>
  // Auto-show current price and prefill input on duration change
  (function(){
    const priceMap = <?= json_encode($overrides ?? []) ?>; // {duration: price}
    const sel = document.getElementById('duration');
    const priceInput = document.getElementById('price');
    const help = document.getElementById('currentPriceHelp');

    function updateHelp(){
      if (!sel || !priceInput || !help) return;
      const d = sel.value;
      if (priceMap[d] !== undefined) {
        help.textContent = 'Current: ₹ ' + priceMap[d];
        priceInput.placeholder = priceMap[d];
      } else {
        help.textContent = 'Current: —';
      }
    }
    if (sel) {
      sel.addEventListener('change', updateHelp);
      updateHelp();
    }
  })();
  
  // Animation for elements
  document.addEventListener('DOMContentLoaded', function() {
    const animatedElements = document.querySelectorAll('.animate-in');
    animatedElements.forEach(element => {
      element.style.animationPlayState = 'running';
    });
  });
</script>

<?= $this->endSection() ?>