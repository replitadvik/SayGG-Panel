<?php
include('conn.php');

$sql21 ="SELECT * FROM lib WHERE id='1'";
$result21 = mysqli_query($conn, $sql21);
$userDetails21 = mysqli_fetch_assoc($result21);

function generateRandomString($length = 7) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, strlen($characters) - 1)];
    }
    return $randomString;
}
$token = md5(generateRandomString()).rand(10,999);
mysqli_query($conn, "UPDATE lib SET token='$token' WHERE id=1");

$timestamp = $userDetails21['last_modified'] ?? time();
$date = new DateTime();
$date->setTimestamp($timestamp);
$last = $date->format('Y-m-d h:i:s a');

date_default_timezone_set("Asia/Kolkata");
$current = date('Y-m-d h:i:s a');

$path = $userDetails21['path'] ?? '';
?>

<?= $this->extend('Layout/Starter') ?>
<?= $this->section('content') ?>

<!-- ===== GLASSMORPHISM THEME – compact + wider sides ===== -->
<style>
:root{
  --glass-bg: rgba(255,255,255,.14);
  --glass-border: rgba(255,255,255,.30);
  --primary:#4facfe; --secondary:#00f2fe;
  --text:#ffffff; --muted:rgba(255,255,255,.75);
  --success:#32d296; --danger:#ff6b6b;
}
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

body{
  font-family:'Poppins',sans-serif; color:var(--text);
  background: linear-gradient(135deg,#667eea,#764ba2) fixed;
  min-height:100dvh;
}

/* page + grid */
.glass-page{ width:98%; max-width:1200px; margin: 12px auto 20px; }
.glass-grid{ display:grid; grid-template-columns: 1.1fr .9fr; gap:14px; }
@media (max-width: 992px){ .glass-grid{ grid-template-columns: 1fr; } }

/* panels */
.glass-panel{
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 12px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 8px 24px rgba(0,0,0,.25); overflow:hidden; transition:.25s;
}
.glass-panel:hover{ transform: translateY(-2px); box-shadow: 0 12px 34px rgba(0,0,0,.35); border-color: rgba(255,255,255,.45); }
.glass-head{
  text-align:center; font-weight:700; padding:14px 16px;
  background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
  border-bottom:1px solid var(--glass-border);
}
.glass-body{ padding:16px; }

/* info rows */
.info-row{ display:flex; align-items:center; justify-content:space-between; gap:10px;
           padding:10px 0; border-bottom:1px solid rgba(255,255,255,.12); }
.info-row:last-child{ border-bottom:none; }
.info-label{ color:var(--muted); font-weight:600; }
.info-text{ font-weight:700; }

/* form controls */
.form-control{
  border:none !important; border-radius:8px !important;
  background: rgba(255,255,255,.10) !important; color:#fff !important;
  padding:11px 14px !important; transition:.25s;
}
.form-control::placeholder{ color:#e9e9e9 !important; opacity:.9; }
.form-control:focus{
  background: rgba(255,255,255,.18) !important;
  box-shadow: 0 0 0 3px rgba(255,255,255,.25) !important;
  outline:none !important;
}
.form-label{ color:#eaeaff; font-weight:600; font-size:12.5px; }

/* buttons */
.btn-glass{
  width:100%; border:none; border-radius:8px; padding:12px;
  font-weight:700; font-size:14px; letter-spacing:.5px;
  color:#fff; cursor:pointer;
  background: linear-gradient(45deg, var(--primary), var(--secondary));
  transition:.25s;
}
.btn-glass:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

/* small helpers */
.center{text-align:center;}
.mt-2{margin-top:.5rem;} .mt-3{margin-top:1rem;} .mt-4{margin-top:1.5rem;}
.mb-2{margin-bottom:.5rem;} .mb-3{margin-bottom:1rem;} .mb-4{margin-bottom:1.5rem;}
</style>

<script>
  function openlink(){
    window.location = "<?= site_url($path) ?>";
  }
</script>

<div class="glass-page">
  <div class="glass-grid">
    <!-- LEFT: ONLINE LIB STATUS -->
    <section class="glass-panel">
      <div class="glass-head">
        <i class="bi bi-hdd-network me-2"></i> ONLINE LIB STATUS
      </div>
      <div class="glass-body">
        <div class="info-row">
          <span class="info-label">Current LIB</span>
          <span class="info-text"><?= htmlspecialchars($userDetails21['name'] ?? '-', ENT_QUOTES) ?></span>
        </div>
        <div class="info-row">
          <span class="info-label">LIB Size</span>
          <span class="info-text"><?= htmlspecialchars($userDetails21['size'] ?? '-', ENT_QUOTES) ?></span>
        </div>
        <div class="info-row">
          <span class="info-label">LIB Path</span>
          <span class="info-text"><?= htmlspecialchars($userDetails21['path'] ?? '-', ENT_QUOTES) ?></span>
        </div>
        <div class="info-row">
          <span class="info-label">Last Modified</span>
          <span class="info-text"><?= htmlspecialchars($last, ENT_QUOTES) ?></span>
        </div>
        <div class="info-row">
          <span class="info-label">Current Time</span>
          <span class="info-text"><?= htmlspecialchars($current, ENT_QUOTES) ?></span>
        </div>

        <div class="center mt-3">
          <button class="btn-glass" onclick="openlink()">
            <i class="bi bi-download me-2"></i>Download
          </button>
        </div>
      </div>
    </section>

    <!-- RIGHT: UPLOAD LIB -->
    <section class="glass-panel">
      <div class="glass-head">
        <i class="bi bi-upload me-2"></i> UPLOAD LIB
      </div>
      <div class="glass-body">
        <form action="<?= site_url('file_upload.php'); ?>" method="post" enctype="multipart/form-data">
          <div class="mb-3">
            <label for="libfile" class="form-label">Choose Lib</label>
            <input type="file" name="libfile" id="libfile" class="form-control">
            <input type="hidden" name="token" value="<?= htmlspecialchars($token, ENT_QUOTES) ?>">
          </div>

          <button type="submit" class="btn-glass">
            <i class="bi bi-cloud-upload me-2"></i>Upload
          </button>
        </form>
      </div>
    </section>
  </div>
</div>

<?= $this->endSection() ?>