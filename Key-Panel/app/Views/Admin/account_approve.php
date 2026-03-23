<?= $this->extend('Layout/Starter') ?>
<?= $this->section('content') ?>
<style>
  /* ===== FIRST THEME — GLASSMORPHISM (compact + wider sides) ===== */
  :root{
    --glass-bg: rgba(255,255,255,.14);
    --glass-border: rgba(255,255,255,.28);
    --primary:#4facfe;            /* blue */
    --secondary:#00f2fe;          /* cyan */
    --text:#ffffff;
    --muted:rgba(255,255,255,.78);
    --success:#32d296;
    --danger:#ff6b6b;
  }
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

  /* Page */
  body{
    font-family:'Poppins',sans-serif; color:var(--text);
    background: radial-gradient(1200px 800px at 10% 10%, rgba(79,172,254,.18), transparent 35%),
                radial-gradient(1200px 800px at 90% 90%, rgba(0,242,254,.16), transparent 35%),
                linear-gradient(135deg,#667eea,#764ba2) fixed;
    min-height:100dvh; overflow-x:hidden;
  }
  .cyber-container{ padding:0rem; } /* keep container name, style changed */

  /* Card => Glass panel */
  .card{
    background: var(--glass-bg) !important;
    border:1px solid var(--glass-border) !important;
    border-radius:12px !important;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,.25);
    overflow:hidden; transition:.25s; position:relative;
  }
  .card:hover{
    transform: translateY(-2px);
    box-shadow: 0 12px 34px rgba(0,0,0,.35);
    border-color: rgba(255,255,255,.45) !important;
  }
  .card::before{
    content:""; position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
    background-size:100% 4px; opacity:.18;
  }

  /* Card header (glass gradient strip) */
  .card-header{
    background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02)) !important;
    border-bottom:1px solid var(--glass-border) !important;
    color:#eafcff !important; padding:14px 16px;
    font-weight:700; letter-spacing:.4px;
    text-shadow:0 0 8px rgba(0,242,255,.35);
  }
  .card-header h2{ font-size:1.05rem; margin:0; }
  .card-header h4{ font-size:1.05rem; margin:0; color:#eafcff !important; }

  /* Alert => glass */
  .alert-dark{
    background: rgba(255,255,255,.10) !important;
    border:1px solid var(--glass-border) !important;
    color:#eafcff !important;
    backdrop-filter: blur(12px);
    border-radius:10px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,.15);
  }
  .alert-success, .alert-danger, .alert-warning {
    background: rgba(255,255,255,.10) !important;
    border:1px solid var(--glass-border) !important;
    backdrop-filter: blur(12px);
    border-radius:10px !important;
    color:#eafcff !important;
  }

  /* Table (DataTables) */
  .table{ color:#fff !important; }
  .table thead th{
    background: rgba(255,255,255,.08) !important;
    border-color: var(--glass-border) !important;
    text-transform:uppercase; font-size:12.5px; letter-spacing:.4px;
    vertical-align:middle;
  }
  .table-bordered{ border-color: var(--glass-border) !important; }
  .table-bordered>:not(caption)>*{ border-color: var(--glass-border) !important; }
  .table-hover tbody tr:hover{ background: rgba(255,255,255,.06) !important; }

  /* Buttons */
  .btn-dark, .btn-outline-light{
    background: rgba(255,255,255,.08) !important;
    border:1px solid var(--glass-border) !important;
    color:#fff !important; border-radius:10px !important;
    transition:.25s; padding:.4rem .65rem;
  }
  .btn-dark:hover, .btn-outline-light:hover{
    background: rgba(255,255,255,.18) !important;
    box-shadow:0 6px 16px rgba(0,0,0,.35);
    border-color: rgba(255,255,255,.45) !important;
  }
  .btn-success{
    background: rgba(50,210,150,.25) !important;
    border:1px solid rgba(50,210,150,.5) !important;
    color:#d8ffe9 !important; border-radius:10px !important;
    transition:.25s;
  }
  .btn-success:hover{
    background: rgba(50,210,150,.35) !important;
    box-shadow:0 6px 16px rgba(0,0,0,.35);
    border-color: rgba(50,210,150,.7) !important;
  }
  .btn-warning{
    background: rgba(255,193,7,.25) !important;
    border:1px solid rgba(255,193,7,.5) !important;
    color:#fff2c2 !important; border-radius:10px !important;
    transition:.25s;
  }
  .btn-warning:hover{
    background: rgba(255,193,7,.35) !important;
    box-shadow:0 6px 16px rgba(0,0,0,.35);
    border-color: rgba(255,193,7,.7) !important;
  }

  /* Badges — soft glass chips */
  .badge{
    padding:6px 10px; border-radius:999px; font-weight:600; font-size:.8rem;
    border:1px solid var(--glass-border);
    background: rgba(0,0,0,.28);
  }
  .badge.bg-primary{ color:#bfe1ff !important; background: rgba(79,172,254,.18) !important; }
  .badge.bg-info{ color:#bff8ff !important; background: rgba(0,242,254,.18) !important; }
  .badge.bg-secondary{ color:#e7e7e7 !important; background: rgba(255,255,255,.12) !important; }
  .badge.bg-success{ color:#d8ffe9 !important; background: rgba(50,210,150,.18) !important; }
  .badge.bg-danger{ color:#ffd3d3 !important; background: rgba(255,107,107,.18) !important; }
  .badge.bg-warning{ color:#fff2c2 !important; background: rgba(255,193,7,.18) !important; }

  /* Small helper */
  .animate-in{ animation: fadeIn .5s ease-out forwards; opacity:0; }
  @keyframes fadeIn{ from{opacity:0; transform:translateY(12px);} to{opacity:1; transform:translateY(0);} }
  
  /* SweetAlert customization */
  .swal2-popup {
    background: var(--glass-bg) !important;
    border: 1px solid var(--glass-border) !important;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-radius: 12px !important;
    color: var(--text) !important;
  }
  .swal2-title {
    color: #eafcff !important;
    text-shadow: 0 0 8px rgba(0,242,255,.35) !important;
  }
  .swal2-confirm {
    background: linear-gradient(45deg, var(--primary), var(--secondary)) !important;
    border: none !important;
    border-radius: 8px !important;
  }

  /* Custom container for approvals page */
  .approvals-container {
    padding: 1rem;
  }

  /* Context badge for admin */
  .context-badge {
    font-size: 0.7rem;
    padding: 3px 8px;
    margin-left: 8px;
    background: rgba(255,255,255,.15) !important;
    border: 1px solid rgba(255,255,255,.3) !important;
  }
</style>
<?= $this->include('Layout/msgStatus') ?>
<div class="cyber-container">
  <div class="row">
    <div class="col-lg-12 animate-in" style="animation-delay:.1s">
      
      <!-- Success/Error Messages -->
      <?php if(session()->getFlashdata('success')): ?>
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          <?= session()->getFlashdata('success') ?>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      <?php endif; ?>
      
      <?php if(session()->getFlashdata('msgDanger')): ?>
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <?= session()->getFlashdata('msgDanger') ?>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      <?php endif; ?>
      
      <?php if(session()->getFlashdata('msgWarning')): ?>
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
          <i class="bi bi-exclamation-circle-fill me-2"></i>
          <?= session()->getFlashdata('msgWarning') ?>
          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      <?php endif; ?>

      <div class="alert alert-dark" role="alert">
        <i class="bi bi-info-circle-fill"></i>
        <strong> SYSTEM ALERT:</strong> 
        <?php if ((int)$user->level === 1): ?>
          You can manage ALL pending account approvals as Owner.
        <?php else: ?>
          You can only manage pending approvals from users you referred.
        <?php endif; ?>
      </div>

      <div class="card shadow-sm">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <div class="d-flex align-items-center">
              <i class="bi bi-person-check-fill me-2"></i>
              <h4 class="mb-0">
                ACCOUNT APPROVALS (PENDING)
                <?php if ((int)$user->level === 2): ?>
                  <span class="context-badge badge bg-info">YOUR REFERRALS ONLY</span>
                <?php endif; ?>
              </h4>
            </div>
            <div>
              <a href="<?= current_url() ?>" class="btn btn-outline-light btn-sm">
                <i class="bi bi-arrow-repeat"></i> Refresh
              </a>
            </div>
          </div>
        </div>

        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-bordered table-hover text-center" style="width:100%">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>USERNAME</th>
                  <th>FULLNAME</th>
                  <th>REFERRED BY</th>
                  <th>REGISTERED</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <?php if (!empty($pending_users)): foreach ($pending_users as $u): ?>
                <tr>
                  <td><?= esc($u->id_users) ?></td>
                  <td>
                    <strong><?= esc($u->username) ?></strong>
                    <?php if ((int)$user->level === 1): ?>
                      <br><small class="text-muted">Level: 
                        <?php 
                          $levelNames = [1 => 'Owner', 2 => 'Admin', 3 => 'Reseller'];
                          echo $levelNames[$u->level] ?? 'Unknown';
                        ?>
                      </small>
                    <?php endif; ?>
                  </td>
                  <td><?= esc($u->fullname) ?></td>
                  <td>
                    <?php if (!empty($u->uplink)): ?>
                      <span class="badge bg-info"><?= esc($u->uplink) ?></span>
                    <?php else: ?>
                      <span class="badge bg-secondary">Direct</span>
                    <?php endif; ?>
                  </td>
                  <td><?= date('Y-m-d H:i', strtotime($u->created_at)) ?></td>
                  <td>
                    <div class="btn-group" role="group">
                      <a href="<?= site_url('user/approve/' . $u->id_users) ?>" class="btn btn-success btn-sm me-1 approve-btn">
                        <i class="bi bi-check2-circle"></i> Approve
                      </a>
                      <a href="<?= site_url('user/decline/' . $u->id_users) ?>" class="btn btn-warning btn-sm decline-btn">
                        <i class="bi bi-x-circle"></i> Decline
                      </a>
                    </div>
                  </td>
                </tr>
                <?php endforeach; else: ?>
                  <tr>
                    <td colspan="6" class="text-muted py-4">
                      <i class="bi bi-inbox display-4 d-block mb-2"></i>
                      <?php if ((int)$user->level === 1): ?>
                        No pending account approvals at the moment.
                      <?php else: ?>
                        No pending account approvals from your referrals.
                      <?php endif; ?>
                    </td>
                  </tr>
                <?php endif; ?>
              </tbody>
            </table>
          </div>

          <?php if (!empty($pending_users)): ?>
            <div class="mt-3 text-center">
              <small class="text-muted">
                <i class="bi bi-info-circle"></i>
                Showing <?= count($pending_users) ?> pending approval<?= count($pending_users) !== 1 ? 's' : '' ?>
                <?php if ((int)$user->level === 2): ?>
                  (from your referrals only)
                <?php endif; ?>
              </small>
            </div>
          <?php endif; ?>
        </div>
      </div>

    </div>
  </div>
</div>
<?= $this->endSection() ?>

<?= $this->section('css') ?>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
<?= $this->endSection() ?>

<?= $this->section('js') ?>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
<script>
  $(document).ready(function() {
    document.querySelectorAll('.animate-in').forEach(el => {
      el.style.animationPlayState = 'running';
    });
    
    // Check for success/error messages and show SweetAlert
    <?php if (session()->getFlashdata('success')): ?>
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: '<?= session()->getFlashdata('success') ?>',
        timer: 3000,
        showConfirmButton: false,
        background: 'rgba(255,255,255,0.14)',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.7)'
      });
    <?php endif; ?>
    
    <?php if (session()->getFlashdata('msgDanger')): ?>
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: '<?= session()->getFlashdata('msgDanger') ?>',
        timer: 4000,
        showConfirmButton: true,
        background: 'rgba(255,255,255,0.14)',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.7)'
      });
    <?php endif; ?>

    <?php if (session()->getFlashdata('msgWarning')): ?>
      Swal.fire({
        icon: 'warning',
        title: 'Warning!',
        text: '<?= session()->getFlashdata('msgWarning') ?>',
        timer: 4000,
        showConfirmButton: true,
        background: 'rgba(255,255,255,0.14)',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.7)'
      });
    <?php endif; ?>
    
    // Approve confirmation with SweetAlert
    $('.approve-btn').on('click', function(e) {
      e.preventDefault();
      const url = this.href;
      const username = $(this).closest('tr').find('td:eq(1)').text().trim();
      
      Swal.fire({
        title: 'Confirm Approval',
        html: `Are you sure you want to approve <strong>${username}</strong>?<br><small class="text-muted">This action cannot be undone.</small>`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#32d296',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Approve!',
        cancelButtonText: 'Cancel',
        background: 'rgba(255,255,255,0.14)',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.7)'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = url;
        }
      });
    });
    
    // Decline confirmation with SweetAlert
    $('.decline-btn').on('click', function(e) {
      e.preventDefault();
      const url = this.href;
      const username = $(this).closest('tr').find('td:eq(1)').text().trim();
      
      Swal.fire({
        title: 'Confirm Decline',
        html: `Are you sure you want to decline <strong>${username}</strong>?<br><small class="text-muted">This will reject their registration.</small>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ffc107',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, Decline!',
        cancelButtonText: 'Cancel',
        background: 'rgba(255,255,255,0.14)',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.7)'
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = url;
        }
      });
    });
  });
</script>
<?= $this->endSection() ?>