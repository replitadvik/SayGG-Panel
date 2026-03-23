<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>
<style>
  /* ===== THEME — GLASSMORPHISM ===== */
  :root{
    --glass-bg: rgba(255,255,255,.14);
    --glass-border: rgba(255,255,255,.30);
    --primary:#4facfe; --secondary:#00f2fe;
    --text:#ffffff; --muted:rgba(255,255,255,.78);
    --success:#32d296; --danger:#ff6b6b; --warning:#ffc107; --info:#0dcaf0;

    /* Fixed element spacing for toasts */
    --fixed-header-h: 64px;
    --fixed-footer-h: 0px;
    --toast-shift: 70px;
  }
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

  body{
    font-family:'Poppins',sans-serif; color:var(--text);
    background: radial-gradient(1200px 800px at 10% 10%, rgba(79,172,254,.18), transparent 35%),
                radial-gradient(1200px 800px at 90% 90%, rgba(0,242,254,.16), transparent 35%),
                linear-gradient(135deg,#667eea,#764ba2) fixed;
    min-height:100dvh;
  }

  .glass-page{ width:98%; max-width:1150px; margin:12px auto 20px; }
  .glass-panel{
    background: var(--glass-bg); border:1px solid var(--glass-border); border-radius:6px;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,.25); overflow:hidden; position:relative;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
  }
  .glass-panel:hover{ transform: translateY(-1px); box-shadow:0 12px 34px rgba(0,0,0,.35); border-color:rgba(255,255,255,.45); }
  .glass-panel::before{
    content:""; position:absolute; inset:0;
    background: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
    background-size:100% 4px; pointer-events:none; opacity:.22;
  }

  .glass-head{
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:12px 16px; background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
    border-bottom:1px solid var(--glass-border); text-shadow:0 0 8px rgba(0,242,255,.35);
  }
  .glass-head .title{ font-weight:700; letter-spacing:.4px; font-size:17px; display:flex; align-items:center; gap:8px; }

  .head-actions{ display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

  .btn-ghost{
    border:1px solid var(--glass-border);
    background: rgba(255,255,255,.10);
    color:#fff; padding:8px 12px; border-radius:6px;
  }
  .btn-ghost:hover{ background: rgba(255,255,255,.16); border-color:rgba(255,255,255,.45); }
  .btn-secondary, .btn-ghost.btn-secondary{
    color:#fff!important; border-color:var(--glass-border)!important;
    background:linear-gradient(45deg,var(--primary),var(--secondary))!important; border-radius:6px; padding:8px 12px;
  }

  .glass-body{ padding:14px 16px; }

  .toolbar{ display:flex; align-items:center; justify-content:flex-end; gap:10px; margin-bottom:10px; }
  .searchbox{
    display:flex; align-items:center; gap:8px; border:1px solid var(--glass-border);
    background: rgba(255,255,255,.10); padding:8px 10px; border-radius:6px; min-width:240px;
  }
  .searchbox input{ background:transparent; border:none; color:#fff; width:100%; outline:none; }

  .table-responsive{ width:100%; }
  table.dataTable{ color:#fff!important; }
  table.dataTable thead th{
    border-bottom:1px solid var(--glass-border)!important;
    white-space:nowrap; text-transform:uppercase; font-size:12.5px; letter-spacing:.4px;
    vertical-align:middle;
  }
  table.dataTable tbody td{ vertical-align:middle; border-color:var(--glass-border)!important; }
  table.dataTable tbody tr:hover{ background:rgba(255,255,255,.06)!important; }
  .table-bordered> :not(caption)>*{ border-color:var(--glass-border)!important; }

  .key-cell{ 
    max-width:340px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; display:inline-block; vertical-align:middle;
    cursor: pointer; transition: all 0.2s ease;
  }
  .key-cell:hover { opacity: 0.8; }

  .dropdown-menu{
    background: rgba(15,18,35,.92)!important;
    border:1px solid rgba(255,255,255,.22)!important;
    backdrop-filter: blur(10px);
    box-shadow:0 12px 34px rgba(0,0,0,.45);
  }
  .dropdown-item{ color:#eaf6ff!important; }
  .dropdown-item:hover{ background: rgba(255,255,255,.10)!important; }
  
  /* ===== Status badges (higher specificity so table.dataTable color doesn't override) ===== */
  .status-badge {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    line-height: 1;
  }
  table.dataTable .status-active {
    background-color: rgba(50, 210, 150, 0.20);
    color: #32d296 !important;
    border: 1px solid rgba(50, 210, 150, 0.40);
  }
  table.dataTable .status-unused {
    background-color: rgba(13, 202, 240, 0.20);
    color: #0dcaf0 !important;
    border: 1px solid rgba(13, 202, 240, 0.40);
  }
  table.dataTable .status-block {
    background-color: rgba(255, 107, 107, 0.20);
    color: #ff6b6b !important;
    border: 1px solid rgba(255, 107, 107, 0.40);
  }
  table.dataTable .status-expired {
    background-color: rgba(255, 193, 7, 0.20);
    color: #ffc107 !important;
    border: 1px solid rgba(255, 193, 7, 0.40);
  }
  
    /* ===============================
       UNIFIED SWEETALERT STYLE
    ================================= */
    
    .swal-reset-box {
      width: 92% !important;
      max-width: 360px !important;
      padding: 16px 18px !important;
      border-radius: 12px !important;
    
      background: linear-gradient(
        145deg,
        rgba(18,18,28,.96),
        rgba(25,25,38,.96)
      ) !important;
    
      border: 1px solid rgba(255,255,255,.06) !important;
      box-shadow: 0 15px 40px rgba(0,0,0,.6) !important;
      overflow: hidden !important;
    }
    
    /* content sizing */
    .reset-card {
      font-size: 12.5px;
      line-height: 1.35;
      text-align: left;
      word-break: break-word;
    }
    
    .reset-row {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,.05);
    }
    
    .reset-row:last-child {
      border-bottom: none;
    }
    
    .reset-row span {
      opacity: .6;
      font-size: 11.5px;
    }
    
    .reset-row b {
      font-size: 12px;
      font-weight: 600;
      text-align: right;
      max-width: 60%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    
    .swal2-confirm,
    .swal2-cancel {
      font-size: 12px !important;
      padding: 6px 14px !important;
      border-radius: 6px !important;
    }
    
    /* mobile safe */
    @media (max-width: 400px) {
      .swal-reset-box {
        width: 94% !important;
      }
    
      .reset-row {
        flex-direction: column;
      }
    
      .reset-row b {
        max-width: 100%;
        white-space: normal;
        text-align: left;
      }
    }

    /* Smooth fade animation */
    .fade-in {
      animation: fadeIn .4s ease forwards;
    }
    
    @keyframes fadeIn {
      from { opacity:0; transform: translateY(6px); }
      to { opacity:1; transform: translateY(0); }
    }
    
    /* Fancy badges */
    .badge {
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    
    .badge-game {
      background: linear-gradient(45deg,#667eea,#764ba2);
    }
    
    .badge-active {
      background: rgba(50,210,150,.2);
      color: #32d296;
      border: 1px solid rgba(50,210,150,.4);
    }
    
    .badge-block {
      background: rgba(255,107,107,.2);
      color: #ff6b6b;
      border: 1px solid rgba(255,107,107,.4);
    }
    
    .badge-device {
      background: rgba(13,202,240,.2);
      color: #0dcaf0;
      border: 1px solid rgba(13,202,240,.4);
    }
    
    .badge-duration {
      background: rgba(255,193,7,.2);
      color: #ffc107;
      border: 1px solid rgba(255,193,7,.4);
    }
    
    .badge-exp {
      background: rgba(255,255,255,.15);
    }
    
    .badge-na {
      background: rgba(120,120,120,.25);
    }
    
    /* Premium action buttons */
    .action-group {
      display: flex;
      gap: 6px;
    }
    
    .action-btn {
      border: none;
      background: rgba(255,255,255,.08);
      color: #fff;
      padding: 6px 8px;
      border-radius: 6px;
      transition: all .2s ease;
    }
    
    .action-btn:hover {
      transform: translateY(-2px);
      background: linear-gradient(45deg,#4facfe,#00f2fe);
      color: #000;
    }

    /* Minimal black & white badge */
    .bw-badge {
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.15);
      color: #fff;
    }
    
    /* Glass neutral badge */
    .glass-badge {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.12);
      color: #ddd;
    }
    
    /* Status */
    .status-active {
      background: rgba(50,210,150,.15);
      border: 1px solid rgba(50,210,150,.4);
      color: #32d296;
    }
    
    .status-block {
      background: rgba(255,107,107,.15);
      border: 1px solid rgba(255,107,107,.4);
      color: #ff6b6b;
    }
    
    /* User key clean style */
    .user-key {
      cursor: pointer;
      font-weight: 500;
      letter-spacing: .3px;
      transition: all .2s ease;
    }
    
    .user-key:hover {
      color: #4facfe;
    }
    
    /* Action buttons clean monochrome */
    .action-btn {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.12);
      color: #ddd;
      padding: 6px 8px;
      border-radius: 6px;
      transition: all .2s ease;
    }
    
    .action-btn:hover {
      background: rgba(255,255,255,.15);
      color: #fff;
      transform: translateY(-2px);
    }

    /* Force true center on mobile */
    .swal2-container {
      z-index: 999999 !important;
    }
    
    .swal2-popup.swal2-toast {
      position: fixed !important;
      top: 80px !important;           /* adjust if header taller */
      left: 50% !important;
      transform: translateX(-50%) !important;
      width: 92% !important;
      max-width: 420px !important;
      margin: 0 !important;
      right: auto !important;
    }

</style>

<div class="glass-page">
  <?= $this->include('Layout/msgStatus') ?>

  <div class="glass-panel">
    <div class="glass-head">
      <div class="title"><i class="bi bi-key-fill"></i> KEYS</div>
      
      <div class="head-actions">

        <div class="dropdown">
          <button class="btn btn-outline-info dropdown-toggle" type="button" id="actionsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-gear"></i> Actions
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="actionsDropdown">
            <!-- Generate -->
            <li>
              <a class="dropdown-item" href="<?= site_url('keys/generate') ?>">
                <i class="bi bi-key me-2"></i>Generate Key
              </a>
            </li>

            <!-- Delete Unused -->
            <li>
              <a class="dropdown-item text-danger" href="<?= site_url('keys/deleteUnused') ?>">
                <i class="bi bi-trash me-2"></i>Delete Unused Keys
              </a>
            </li>

            <!-- Delete Expired -->
            <li>
              <a class="dropdown-item text-warning" href="<?= site_url('keys/deleteExp') ?>">
                <i class="bi bi-hourglass-bottom me-2"></i>Del-Expired Keys
              </a>
            </li>

            <!-- Reset All -->
            <li>
              <a class="dropdown-item text-danger" href="<?= site_url('keys/resetAl') ?>">
                <i class="bi bi-bootstrap-reboot me-2"></i>Reset All Keys
              </a>
            </li>

            <?php if (isset($user) && (int)$user->level === 1): ?>
              <li><hr class="dropdown-divider"></li>
              <li><h6 class="dropdown-header">Owner Actions</h6></li>

              <!-- Delete Banned/Blocked -->
              <li>
                <a class="dropdown-item text-warning" href="<?= site_url('keys/DelblockKeys') ?>">
                  <i class="bi bi-slash-circle me-2"></i>Del-Banned/Blocked Keys
                </a>
              </li>

              <!-- Delete All -->
              <li>
                <a class="dropdown-item text-danger" href="<?= site_url('keys/delete/all') ?>">
                  <i class="bi bi-exclamation-octagon-fill me-2"></i>Delete All Keys
                </a>
              </li>
            <?php endif; ?>
          </ul>
        </div>
      </div>
    </div>

    <div class="glass-body">
      <!-- right aligned search -->
      <div class="toolbar">
        <div class="searchbox">
          <i class="bi bi-search"></i>
          <input id="tableSearch" type="text" placeholder="Search keys, game, duration...">
        </div>
      </div>

      <?php if (!empty($keylist)) : ?>
        <div class="table-responsive">
          <table id="datatable" class="table table-bordered table-hover text-center w-100">
            <thead>
              <tr>
                <th>#</th>
                <th>GAME</th>
                <th id="th-userkey" title="Click to reset ALL keys">USER KEY</th>
                <th>STATUS</th>
                <th>DEVICES</th>
                <th>DURATION</th>
                <th>EXPIRATION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
          </table>
        </div>
      <?php else : ?>
        <p class="text-center" style="color:var(--muted); margin:10px 0;">No keys found in database</p>
      <?php endif; ?>
    </div>
  </div>
</div>
<?= $this->endSection() ?>

<?= $this->section('css') ?>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/datatables.net-bs5/1.13.6/dataTables.bootstrap5.min.css">
<?= $this->endSection() ?>

<?= $this->section('js') ?>

<script src="https://cdnjs.cloudflare.com/ajax/libs/datatables.net/1.13.6/jquery.dataTables.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/datatables.net-bs5/1.13.6/dataTables.bootstrap5.min.js"></script>

<script>

    window.Toast = Swal.mixin({
      toast: true,
      position: 'top',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true
    });

  // CSRF (CI4) — filled if enabled
  const CSRF_NAME = '<?= function_exists("csrf_token") ? csrf_token() : "" ?>';
  let CSRF_HASH   = '<?= function_exists("csrf_hash") ? csrf_hash() : "" ?>'; // 🔥 must be let
    
  let table;
  let requestRunning = false;

  <?php $__UL = isset($user) ? (int)$user->level : (int)(session('user_level') ?? 0); ?>
  const USER_LEVEL = <?= $__UL ?>;

    $(window).on('load', function () {
    
      const localData = <?= $keys_json ?? '[]' ?>;
    
      if (!Array.isArray(localData)) {
        console.error("Data is not array");
        return;
      }
    
      if ($.fn.DataTable.isDataTable('#datatable')) {
        $('#datatable').DataTable().destroy();
        $('#datatable').empty();
      }
    
      table = $('#datatable').DataTable({
        data: localData,
        destroy: true,
        processing: false,
        serverSide: false,
        pageLength: 25,
        order: [[0, "desc"]],
        autoWidth: false,
        dom: 'rtip', // removes show entries dropdown
        columns: [
        
          { data: 'id_keys' },
        
          // GAME (Black & White Minimal)
          {
            data: 'game',
            render: function(data){
              return `
                <span class="badge bw-badge fade-in">
                  ${data}
                </span>
              `;
            }
          },
        
          // USER KEY (No emoji, clean copy)
          {
            data: 'user_key',
            render: function(data){
              const key = data ?? '';
              return `
                <span class="user-key fade-in"
                      onclick="copyKey('${key}')"
                      title="Tap to copy">
                  ${key}
                </span>
              `;
            }
          },
        
          // STATUS
          {
            data: 'status',
            render: function(data){
              return data == 1
                ? `<span class="badge status-active fade-in">Active</span>`
                : `<span class="badge status-block fade-in">Blocked</span>`;
            }
          },
        
          // DEVICES (Same vibe as expiration)
          {
            data: null,
            render: function(row){
              const devices = typeof row.devices === 'string'
                ? row.devices.split(',').filter(Boolean).length
                : 0;
        
              const max = row.max_devices ?? 0;
        
              return `
                <span class="badge glass-badge fade-in">
                  ${devices}/${max}
                </span>
              `;
            }
          },
        
          // DURATION (Same style)
          {
            data: 'duration',
            render: function(data){
              return `
                <span class="badge glass-badge fade-in">
                  ${data}H
                </span>
              `;
            }
          },
        
          // EXPIRATION
          {
              data: 'expired_date',
              render: function(data){
            
                if (!data) {
                  return `<span class="badge glass-badge fade-in">
                            Not Activated
                          </span>`;
                }
            
                const date = new Date(data.replace(' ', 'T'));
            
                const options = {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                };
            
                const formatted = date.toLocaleString('en-US', options);
            
                return `
                  <span class="badge glass-badge fade-in">
                    ${formatted}
                  </span>
                `;
              }
            },
        
          // ACTIONS (Keep your current style)
          {
            data: null,
            orderable: false,
            searchable: false,
            render: function(row){
        
              const key = row.user_key ?? '';
              const id  = row.id_keys ?? 0;
        
              return `
                <div class="action-group fade-in">
        
                  <button class="btn action-btn btn-extend"
                    data-key="${key}">
                    <i class="bi bi-plus"></i>
                  </button>
        
                  <a href="<?= site_url('keys') ?>/${id}"
                    class="btn action-btn btn-edit">
                    <i class="bi bi-pencil"></i>
                  </a>
        
                  <button class="btn action-btn btn-reset"
                    onclick="resetUserKey('${key}')">
                    <i class="bi bi-arrow-clockwise"></i>
                  </button>
        
                  <button class="btn action-btn btn-delete"
                    onclick="deleteUserKey('${key}')">
                    <i class="bi bi-trash"></i>
                  </button>
        
                </div>
              `;
            }
          }
        
        ]
      });
    
    });

    function copyKey(key) {
    
      if (!key) return;
    
      navigator.clipboard.writeText(key).then(() => {
    
        Toast.fire({
          icon: 'success',
          title: 'Key copied'
        });
    
      }).catch(() => {
        console.error("Clipboard failed");
      });
    
    }

    // global search (right top)
    $('#tableSearch').on('keyup change', function(){
      table.search(this.value).draw();
    });

    function deleteUserKey(keys) {
    
      Swal.fire({
        title: 'Confirm Delete',
        text: 'This action cannot be undone!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete',
        confirmButtonColor: '#ff6b6b',
        cancelButtonColor: '#4facfe',
        background: 'rgba(18,18,25,.98)',
        color: '#fff',
        backdrop: 'rgba(0,0,0,.75)',
        customClass: { popup: 'swal-reset-box' }
      }).then((res) => {
    
        if (!res.isConfirmed) return;
    
        if (requestRunning) {
          Toast.fire({ icon:'warning', title:'Please wait...' });
          return;
        }
    
        requestRunning = true;
    
        const payload = {
          userkey: keys
        };
    
        if (CSRF_NAME && CSRF_HASH) {
          payload[CSRF_NAME] = CSRF_HASH;
        }
    
        Toast.fire({ icon: 'info', title: 'Deleting...' });
    
        $.ajax({
          url: "<?= site_url('keys/delete') ?>",
          type: "POST",
          data: payload,
          dataType: "json",
    
          success: function(data){
    
            try {
    
              // 🔄 refresh csrf
              if (data?.csrf_hash) {
                CSRF_HASH = data.csrf_hash;
              }
    
              if (data?.success) {
    
                // remove row safely
                table.rows(function(idx, row){
                  return row.user_key === keys;
                }).remove().draw(false);
    
                Toast.fire({
                  icon: 'success',
                  title: 'Deleted successfully'
                });
    
              } else {
    
                Swal.fire({
                  icon: 'error',
                  title: 'Delete Failed',
                  text: data?.message || 'Unable to delete key.'
                });
    
              }
    
            } catch(e) {
              console.error(e);
              Toast.fire({ icon:'error', title:'Unexpected error' });
            }
    
          },
    
          error: function(xhr){
    
            console.error("Delete error:", xhr.responseText);
    
            Toast.fire({
              icon:'error',
              title:'Server error'
            });
    
          },
    
          complete: function(){
            requestRunning = false; // 🔓 always unlock
          }
    
        });
    
      });
    }

    function resetUserKey(keys){
    
      Swal.fire({
        title: 'Reset Device Count?',
        text: 'This will remove all devices. User must login again.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Reset',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#4facfe',
        cancelButtonColor: '#ff6b6b',
        background: 'rgba(18,18,25,.98)',
        color: '#fff',
        backdrop: 'rgba(0,0,0,.75)',
        customClass: { popup: 'swal-reset-box' }
    
      }).then((res)=>{
    
        if(!res.isConfirmed) return;
    
        if(requestRunning){
          Toast.fire({ icon:'warning', title:'Please wait...' });
          return;
        }
    
        requestRunning = true;
        Toast.fire({ icon: 'info', title: 'Processing...' });
        
        let payload = {
          userkey: keys,
          reset: 1
        };
        
        if (CSRF_NAME && CSRF_HASH) {
          payload[CSRF_NAME] = CSRF_HASH;
        }
    
        $.ajax({
          url: "<?= site_url('keys/reset') ?>",
          type: "POST",
          data: payload,
          dataType: "json",
    
          success: function(data){
    
            if(data?.csrf_hash){
              CSRF_HASH = data.csrf_hash;
            }
    
            if (data?.registered && data?.reset) {
    
              // 🔥 Update DataTable row properly
              table.rows().every(function(){
                let row = this.data();
                if(row.user_key === keys){
                  row.devices = null;
                  this.data(row);
                }
              });
    
              table.draw(false);
    
              const resetLeftText = data.reset_left === 'Unlimited'
                ? '♾ Unlimited (Owner Access)'
                : `🟢 ${data.reset_left} Resets Remaining`;
    
              Swal.fire({
                icon: 'success',
                title: 'Reset Successful',
                html: `
                  <div class="reset-card">
    
                    <div class="reset-row">
                      <span>🔑 Key</span>
                      <b>${data.key}</b>
                    </div>
    
                    <div class="reset-row">
                      <span>🎮 Game</span>
                      <b>${data.game}</b>
                    </div>
    
                    <div class="reset-row">
                      <span>📱 Devices</span>
                      <b>0 / ${data.devices_max}</b>
                    </div>
    
                    <div class="reset-row">
                      <span>⏳ Duration</span>
                      <b>${data.duration} Hours</b>
                    </div>
    
                    <div class="reset-row">
                      <span>📅 Expiry</span>
                      <b>${data.expired_date ?? 'Not Activated'}</b>
                    </div>
    
                    <div class="reset-divider"></div>
    
                    <div class="reset-stats-box">
                      <div class="reset-used">
                        Reset Used: ${data.reset_used} / ${data.reset_limit}
                      </div>
                      <div class="reset-left">
                        ${resetLeftText}
                      </div>
                    </div>
    
                  </div>
                `,
                confirmButtonColor: '#4facfe',
                background: 'rgba(18,18,25,.98)',
                color: '#fff',
                backdrop: 'rgba(0,0,0,.75)',
                customClass: { popup: 'swal-reset-box' }
              });
    
            } else {
    
              Swal.fire({
                icon: 'info',
                title: 'Nothing To Reset',
                text: data?.message || 'This key has no registered devices.',
                confirmButtonColor: '#4facfe',
                background: 'rgba(18,18,25,.98)',
                color: '#fff',
                backdrop: 'rgba(0,0,0,.75)',
                customClass: { popup: 'swal-reset-box' }
              });
    
            }
    
          },
    
            error: function(xhr){
            
              let status  = xhr.status;
              let message = 'Unknown error';
            
              try {
                message = xhr.responseText.substring(0, 300);
              } catch(e){}
            
              Swal.fire({
                icon: 'error',
                title: 'Server Error (' + status + ')',
                html: `
                  <div style="text-align:left;font-size:12px;max-height:200px;overflow:auto;">
                    ${message}
                  </div>
                `,
                confirmButtonColor: '#ff6b6b',
                background: 'rgba(18,18,25,.98)',
                color: '#fff',
                backdrop: 'rgba(0,0,0,.75)',
                customClass: { popup: 'swal-reset-box' }
              });
            },
    
          complete: function(){
            requestRunning = false;
          }
    
        });
    
      });
    }


    // === Reset ALL device counts ===
    function resetAllKeys(){
    
      Swal.fire({
        title: 'RESET ALL KEYS?',
        text: 'This will reset device count for ALL keys. Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'YES, RESET ALL',
        confirmButtonColor: '#4facfe',
        cancelButtonColor: '#ff6b6b',
        background: 'rgba(18,18,25,.98)',
        color: '#fff',
        backdrop: 'rgba(0,0,0,.75)',
        customClass: { popup: 'swal-reset-box' }
      }).then((res)=>{
    
        if(!res.isConfirmed) return;
    
        if(requestRunning){
          Toast.fire({ icon:'warning', title:'Please wait...' });
          return;
        }
    
        requestRunning = true;
        Toast.fire({ icon:'info', title:'Processing...' });
    
        $.ajax({
          url: "<?= site_url('keys/resetAll') ?>",
          type: "POST",
          data: {
            all: 1,
            reset: 1,
            [CSRF_NAME]: CSRF_HASH
          },
          dataType: "json",
    
          success: function(data){
    
            if(data?.csrf_hash){
              CSRF_HASH = data.csrf_hash;
            }
    
            const ok = data?.ok || data?.success;
    
            if(ok){
    
              // update table UI instantly
              table.rows().every(function(){
                let row = this.data();
                row.devices = null;
                this.data(row);
              });
    
              table.draw(false);
    
              Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: data?.message || 'All keys reset.',
                confirmButtonColor: '#4facfe',
                background: 'rgba(18,18,25,.98)',
                color: '#fff',
                customClass: { popup: 'swal-reset-box' }
              });
    
            } else {
    
              Swal.fire({
                icon: 'error',
                title: 'Failed!',
                text: data?.message || 'Unable to reset all keys.',
                confirmButtonColor: '#ff6b6b',
                background: 'rgba(18,18,25,.98)',
                color: '#fff',
                customClass: { popup: 'swal-reset-box' }
              });
    
            }
    
          },
    
          error: function(){
            Swal.fire({
              icon: 'error',
              title: 'Server Error',
              text: 'Unable to connect.',
              confirmButtonColor: '#ff6b6b',
              background: 'rgba(18,18,25,.98)',
              color: '#fff',
              customClass: { popup: 'swal-reset-box' }
            });
          },
    
          complete: function(){
            requestRunning = false;
          }
    
        });
    
      });
    }

    // Make sure this exists ONCE globally
    // let table;
    // let requestRunning = false;
    
    function handleExtendKey(userKey){
    
      Swal.fire({
        title: 'Extend Key',
        input: 'text',
        inputLabel: 'Duration (e.g., 30D or 12H)',
        inputPlaceholder: '30D or 12H',
        showCancelButton: true,
        confirmButtonText: 'Extend',
        confirmButtonColor: '#4facfe',
        cancelButtonColor: '#ff6b6b',
        background: 'rgba(18,18,25,.98)',
        color: '#fff',
        customClass: { popup: 'swal-reset-box' },
        preConfirm: (value) => {
          const v = (value || '').trim().toUpperCase();
          if(!/^\d+[DH]$/.test(v)){
            Swal.showValidationMessage('Use format like 30D or 12H');
            return false;
          }
          return v;
        }
      }).then((res)=>{
    
        if(!res.isConfirmed) return;
    
        if(requestRunning){
          Toast.fire({ icon:'warning', title:'Please wait...' });
          return;
        }
    
        requestRunning = true;
    
        const duration = res.value;
    
        const payload = {
          extend_single_form: 1,
          user_key: userKey,
          duration: duration
        };
    
        if (CSRF_NAME && CSRF_HASH) {
          payload[CSRF_NAME] = CSRF_HASH;
        }
    
        Toast.fire({ icon:'info', title:'Extending...' });
    
        $.ajax({
          url: "<?= site_url('keys/extend') ?>",
          type: "POST",
          data: payload,
          dataType: "json",
    
          success: function(response){
    
            try {
    
              // 🔄 Refresh CSRF safely
              if(response?.csrf_hash){
                CSRF_HASH = response.csrf_hash;
              }
    
              if(response?.success){
    
                let updated = false;
    
                table.rows().every(function(){
                  const row = this.data();
    
                  if(row?.user_key?.trim() === userKey.trim()){
                    row.expired_date = response.new_expiry;
                    row.duration     = response.total_duration;
                    this.data(row);
                    updated = true;
                  }
                });
    
                if(updated){
                  table.draw(false);
                }
    
                Toast.fire({
                  icon:'success',
                  title:`Extended by ${duration}`
                });
    
              } else {
    
                Toast.fire({
                  icon:'error',
                  title: response?.message || 'Extend failed'
                });
    
              }
    
            } catch(e) {
              console.error("Extend crash:", e);
              Toast.fire({ icon:'error', title:'Unexpected error' });
            }
    
          },
    
          error: function(xhr){
    
            try {
              const err = JSON.parse(xhr.responseText);
              if(err?.csrf_hash){
                CSRF_HASH = err.csrf_hash;
              }
            } catch(e){}
    
            Toast.fire({
              icon:'error',
              title:'Server error'
            });
    
          },
    
          complete: function(){
            // 🔓 Always unlock
            requestRunning = false;
          }
    
        });
    
      });
    
    }
    
    
    // ===============================
    // Bindings (FIXED)
    // ===============================
    
    // Reset All Button
    $(document).on('click', '#resetAllKeysBtn', function(){
      resetAllKeys();
    });
    
    // Extend Button
    $(document).on('click', '.btn-extend', function(){
      if (typeof USER_LEVEL !== 'undefined' && USER_LEVEL >= 3) {
        Toast.fire({ icon: 'warning', title: 'Not allowed for your level' });
        return;
      }
    
      const ukey = $(this).data('key');
      if (ukey) {
        handleExtendKey(ukey);
      }
    });
</script>
<?= $this->endSection() ?>