<?php
function color($value) {
    if($value == 1) {
        return "#0000FF";
    } else {
        return "#FF0000";
    }
}
?>

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

  /* Alert => glass */
  .alert-dark{
    background: rgba(255,255,255,.10) !important;
    border:1px solid var(--glass-border) !important;
    color:#eafcff !important;
    backdrop-filter: blur(12px);
    border-radius:10px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,.15);
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
  .btn-dark{
    background: rgba(255,255,255,.08) !important;
    border:1px solid var(--glass-border) !important;
    color:#fff !important; border-radius:10px !important;
    transition:.25s; padding:.4rem .65rem;
  }
  .btn-dark:hover{
    background: rgba(255,255,255,.18) !important;
    box-shadow:0 6px 16px rgba(0,0,0,.35);
    border-color: rgba(255,255,255,.45) !important;
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
  
  /* Search form styling */
  .search-form {
    background: rgba(255,255,255,.06);
    border-radius: 10px;
    padding: 15px;
    margin-bottom: 20px;
    border: 1px solid var(--glass-border);
  }
  .search-form .form-control {
    background: rgba(255,255,255,.08);
    border: 1px solid var(--glass-border);
    color: #fff;
    border-radius: 8px;
  }
  .search-form .form-control:focus {
    background: rgba(255,255,255,.12);
    box-shadow: 0 0 0 0.2rem rgba(79, 172, 254, 0.25);
    border-color: var(--primary);
    color: #fff;
  }
  .search-form .btn-search {
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    border: none;
    border-radius: 8px;
    font-weight: 600;
  }
  
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
</style>

<?= $this->include('Layout/msgStatus') ?>

<div class="cyber-container">
  <div class="row">
    <div class="col-lg-12 animate-in" style="animation-delay:.1s">
      <!-- Success/Error Messages -->
      <?php if (session()->getFlashdata('success')): ?>
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="bi bi-check-circle-fill me-2"></i>
          <?= session()->getFlashdata('success') ?>
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      <?php endif; ?>
      
      <?php if (session()->getFlashdata('error')): ?>
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <?= session()->getFlashdata('error') ?>
          <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
      <?php endif; ?>

      <div class="alert alert-dark" role="alert">
        <i class="bi bi-info-circle-fill"></i>
        <strong> SYSTEM ALERT:</strong> Search users by username, fullname, saldo or uplink.
      </div>

      <!-- Search Form -->
      <div class="card shadow-sm mb-3">
        <div class="card-header">
          <div class="d-flex align-items-center">
            <i class="bi bi-search me-2"></i>
            <h2 class="mb-0">SEARCH USER</h2>
          </div>
        </div>
        <div class="card-body">
          <form method="get" action="" class="search-form">
            <div class="row">
              <div class="col-md-8">
                <input type="text" name="search" class="form-control" placeholder="Enter username, fullname, saldo or uplink..." value="<?= isset($_GET['search']) ? esc($_GET['search']) : '' ?>">
              </div>
              <div class="col-md-4">
                <button type="submit" class="btn btn-search w-100">
                  <i class="bi bi-search"></i> SEARCH
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="card-header">
          <div class="d-flex align-items-center">
            <i class="bi bi-people-fill me-2"></i>
            <h2 class="mb-0">USER MANAGEMENT SYSTEM</h2>
          </div>
        </div>

        <div class="card-body">
          <?php if ($user_list) : ?>
          <div class="table-responsive">
            <table id="usersTable" class="table table-bordered table-hover text-center" style="width:100%">
              <thead>
                <tr>
                  <th scope="row">ID</th>
                  <th>USERNAME</th>
                  <th>FULLNAME</th>
                  <th>ACCESS LEVEL</th>
                  <th>BALANCE</th>
                  <th>STATUS</th>
                  <th>UPLINK</th>
                  <th>REGISTERED DATE</th>
                  <th>EXPIRATION</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($user_list as $u) : ?>
                <tr>
                  <td><?= $u->id_users ?></td>
                  <td><?= $u->username ?></td>
                  <td><?= $u->fullname ?></td>
                  <td>
                    <?php if($u->level == 1) : ?>
                      <span class="badge bg-primary">OWNER</span>
                    <?php elseif($u->level == 2) : ?>
                      <span class="badge bg-info">ADMIN</span>
                    <?php else : ?>
                      <span class="badge bg-secondary">RESELLER</span>
                    <?php endif; ?>
                  </td>
                  <td>
                    <?php if($u->level == 1) : ?>
                      <span class="text-primary" style="text-shadow:0 0 10px rgba(96,165,250,.7);">&infin;</span>
                    <?php else : ?>
                      <span class="text-success" style="text-shadow:0 0 10px rgba(74,222,128,.45);"><?= $u->saldo ?></span>
                    <?php endif; ?>
                  </td>
                  <td>
                    <?php if($u->status == 1) : ?>
                      <span class="badge bg-success">ACTIVE</span>
                    <?php elseif($u->status == 2) : ?>
                      <span class="badge bg-danger">BANNED</span>
                    <?php else : ?>
                      <span class="badge bg-warning text-dark">EXPIRED</span>
                    <?php endif; ?>
                  </td>
                  <td><?= $u->uplink ?></td>
                  <td><?= date('Y-m-d H:i', strtotime($u->created_at)) ?></td>
                  <td><?= $u->expiration_date ?></td>
                  <td>
                    <a href="<?= site_url('user/' . $u->id_users) ?>" class="btn btn-dark btn-sm me-1">
                      <i class="bi bi-pencil-square"></i> EDIT
                    </a>
                    <form action="<?= site_url('user/delete/' . $u->id_users) ?>" method="post" class="d-inline delete-form">
                      <?= csrf_field() ?>
                      <input type="hidden" name="_method" value="DELETE">
                      <button type="submit" class="btn btn-danger btn-sm">
                        <i class="bi bi-trash"></i> DELETE
                      </button>
                    </form>
                  </td>
                </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
          <?php endif; ?>
        </div>
      </div>

    </div>
  </div>
</div>
<?= $this->endSection() ?>

<?= $this->section('css') ?>
<?= link_tag("https://cdn.datatables.net/1.10.25/css/dataTables.bootstrap5.min.css") ?>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">
<?= $this->endSection() ?>

<?= $this->section('js') ?>
<?= script_tag("https://cdn.datatables.net/1.10.25/js/jquery.dataTables.min.js") ?>
<?= script_tag("https://cdn.datatables.net/1.10.25/js/dataTables.bootstrap5.min.js") ?>
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
<script>
  $(document).ready(function() {
    // Get search parameter from URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchValue = urlParams.get('search');
    
    // Initialize DataTable with search if parameter exists
    const table = $('#usersTable').DataTable({
      order: [[0, "desc"]],
      language: {
        search: "<i class='bi bi-search'></i> SEARCH:",
        searchPlaceholder: "Enter username, fullname, saldo or uplink..."
      }
    });
    
    // If search parameter exists, apply it to the table
    if (searchValue) {
      table.search(searchValue).draw();
    }
    
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
        showConfirmButton: false
      });
    <?php endif; ?>
    
    <?php if (session()->getFlashdata('error')): ?>
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: '<?= session()->getFlashdata('error') ?>',
        timer: 4000,
        showConfirmButton: true
      });
    <?php endif; ?>
    
    // Delete confirmation with SweetAlert
    $('.delete-form').on('submit', function(e) {
      e.preventDefault();
      const form = this;
      const username = $(this).closest('tr').find('td:eq(1)').text();
      
      Swal.fire({
        title: 'Confirm Delete',
        html: `Are you sure you want to delete <strong>${username}</strong>?<br>This action cannot be undone.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        background: 'rgba(255,255,255,0.14)',
        color: '#ffffff',
        backdrop: 'rgba(0,0,0,0.7)'
      }).then((result) => {
        if (result.isConfirmed) {
          form.submit();
        }
      });
    });
  });
</script>
<?= $this->endSection() ?>