<?php
include('conn.php');

// For Highest id Ref
$sqli = "SELECT * FROM referral_code
ORDER BY id_reff DESC
LIMIT 1;";
$result = mysqli_query($conn, $sqli);
$id_reff = mysqli_fetch_assoc($result);

// For Referral Code
$sql = "SELECT Referral FROM referral_code";
$result = mysqli_query($conn, $sql);
$refcode = mysqli_fetch_assoc($result);
$row = $refcode;
?>

<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>

<style>
  /* ===== GLASSMORPHISM THEME – compact + wider sides ===== */
  :root{
    --glass-bg: rgba(255,255,255,.14);
    --glass-border: rgba(255,255,255,.30);
    --primary:#4facfe; --secondary:#00f2fe;
    --text:#ffffff; --muted:rgba(255,255,255,.75);
    --success:#32d296; --navbar-h:36px;
  }
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

  body{
    font-family:'Poppins',sans-serif; color:var(--text);
    background: linear-gradient(135deg,#667eea,#764ba2) fixed; min-height:100dvh;
  }

  .glass-page{ width:98%; max-width:1200px; margin: 10px auto 20px; }
  .grid-2{ display:grid; grid-template-columns: 1fr 1.4fr; gap:14px; }
  @media (max-width: 992px){ .grid-2{ grid-template-columns: 1fr; } }

  .glass-panel{
    background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 12px;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,.25); overflow:hidden; transition:.25s;
  }
  .glass-panel:hover{ transform: translateY(-2px); box-shadow: 0 12px 34px rgba(0,0,0,.35); border-color: rgba(255,255,255,.45); }

  .glass-head{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:14px 16px; background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
    border-bottom:1px solid var(--glass-border); font-weight:700;
  }
  .glass-head .title{ font-size:17px; letter-spacing:.4px; display:flex; align-items:center; gap:10px; }
  .glass-body{ padding:16px; }

  /* form */
  .form-label{ color:#eaeaff; font-weight:600; font-size:12.5px; }
  .form-control, .form-select{
    border:none !important; border-radius:10px !important;
    background: rgba(255,255,255,.10) !important; color:#fff !important;
    padding:12px 14px !important; transition:.25s;
  }
  .form-control::placeholder{ color:#e9e9e9 !important; opacity:.9; }
  .form-control:focus, .form-select:focus{
    background: rgba(255,255,255,.18) !important; box-shadow: 0 0 0 3px rgba(255,255,255,.25) !important;
    outline:none !important;
  }
  .invalid-feedback{ display:block; color:#ffd1d1; font-size:.85rem; margin-top:6px; }

  /* input group */
  .input-group .input-group-text{
    background: rgba(255,255,255,.10); color:#fff; border:1px solid var(--glass-border);
    border-right:none; border-radius:10px 0 0 10px;
  }
  .input-group .form-control{ border-radius:0 10px 10px 0 !important; }

  /* button */
  .btn-glass{
    width:100%; border:none; border-radius:10px; padding:12px 14px;
    font-weight:700; font-size:14px; letter-spacing:.5px;
    color:#fff; cursor:pointer; background: linear-gradient(45deg, var(--primary), var(--secondary));
    transition:.25s;
  }
  .btn-glass:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

  /* table */
  .table { color:#fff; }
  .table thead th{
    background: rgba(255,255,255,.06); border-bottom:1px solid var(--glass-border); font-size:12.5px;
    letter-spacing:.4px; text-transform:uppercase; vertical-align:middle;
  }
  .table tbody td{ vertical-align:middle; border-color:var(--glass-border); }
  .table-hover tbody tr:hover{ background:rgba(255,255,255,.06); }
  .table-bordered{ border-color:var(--glass-border); }

  .muted{ color:var(--muted); }
  code{ color:#c7f5ff; }
  
  /* Search box */
  .search-container {
    position: relative;
    margin-bottom: 16px;
  }
  .search-container .form-control {
    padding-right: 40px;
  }
  .search-container i {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--muted);
  }
  
  /* No results message */
  .no-results {
    display: none;
    text-align: center;
    padding: 20px;
    color: var(--muted);
  }
</style>

<div class="glass-page">
  <div class="row mb-2">
    <div class="col-12">
      <?= $this->include('Layout/msgStatus') ?>
    </div>
  </div>

  <div class="grid-2">
    <!-- LEFT: Generate Referral -->
    <div class="glass-panel">
      <div class="glass-head">
        <div class="title"><i class="bi bi-key"></i> Generate Referral Code</div>
      </div>
      <div class="glass-body">
        <?= form_open() ?>
          <div class="mb-2 form-label">Set Saldo Amount</div>
          <div class="input-group mb-2">
            <span class="input-group-text"><i class="bi bi-coin"></i></span>
            <input type="number" class="form-control" name="set_saldo" id="set_saldo" minlength="1" maxlength="11" value="5">
          </div>
          <?php if ($validation->hasError('set_saldo')) : ?>
            <div class="invalid-feedback"><?= $validation->getError('set_saldo') ?></div>
          <?php endif; ?>

          <label for="accExpire" class="form-label mt-2">Account Expiration</label>
          <?= form_dropdown(['class' => 'form-select', 'name' => 'accExpire', 'id' => 'accExpire'], $accExpire, old('accExpire') ?: '') ?>
          <?php if ($validation->hasError('accExpire')) : ?>
            <div class="invalid-feedback"><?= $validation->getError('accExpire') ?></div>
          <?php endif; ?>

          <label for="accLevel" class="form-label mt-2">Account Level</label>
          <?= form_dropdown(['class' => 'form-select', 'name' => 'accLevel', 'id' => 'accLevel'], $accLevel, old('accLevel') ?: '') ?>
          <?php if ($validation->hasError('accLevel')) : ?>
            <div class="invalid-feedback"><?= $validation->getError('accLevel') ?></div>
          <?php endif; ?>

          <div class="mt-3">
            <button type="submit" class="btn-glass"><i class="bi bi-lightning-charge"></i> Generate Code</button>
          </div>
        <?= form_close() ?>
      </div>
    </div>

    <!-- RIGHT: History -->
    <div class="glass-panel">
      <div class="glass-head">
        <div class="title"><i class="bi bi-clock-history"></i> Code History<?= isset($total_code) ? " — Total {$total_code}" : "" ?></div>
      </div>
      <div class="glass-body">
        <!-- Search Box -->
        <div class="search-container">
          <input type="text" class="form-control" id="searchInput" placeholder="Search referrals...">
          <i class="bi bi-search"></i>
        </div>
        
        <?php if ($code) : ?>
          <div class="table-responsive">
            <table class="table table-bordered table-hover align-middle" id="referralTable">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Referral</th>
                  <th>Hashed</th>
                  <th>Saldo</th>
                  <th>Level</th>
                  <th>Expiration</th>
                  <th>Used By</th>
                  <th>Created By</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($code as $c) : ?>
                  <tr>
                    <td><?= $c->id_reff ?></td>
                    <td><code><?= $c->Referral ?></code></td>
                    <td><code><?= substr($c->code, 1, 15) ?></code></td>
                    <td>₹<?= $c->set_saldo ?></td>
                    <td><?= $c->level ?></td>
                    <td><?= $c->acc_expiration ?></td>
                    <td><?= $c->used_by ?: '—' ?></td>
                    <td><?= $c->created_by ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
            <div class="no-results" id="noResults">
              <i class="bi bi-search" style="font-size: 2rem;"></i>
              <p>No matching referrals found</p>
            </div>
          </div>
        <?php else: ?>
          <div class="muted">No codes found.</div>
        <?php endif; ?>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
  // Search functionality
  const searchInput = document.getElementById('searchInput');
  const table = document.getElementById('referralTable');
  const noResults = document.getElementById('noResults');
  
  if (searchInput && table) {
    searchInput.addEventListener('keyup', function() {
      const searchText = this.value.toLowerCase();
      const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
      let visibleCount = 0;
      
      for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName('td');
        let found = false;
        
        for (let j = 0; j < cells.length; j++) {
          const cellText = cells[j].textContent.toLowerCase();
          if (cellText.includes(searchText)) {
            found = true;
            break;
          }
        }
        
        rows[i].style.display = found ? '' : 'none';
        if (found) visibleCount++;
      }
      
      // Show/hide no results message
      if (noResults) {
        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
      }
    });
  }
});
</script>

<?= $this->endSection() ?>