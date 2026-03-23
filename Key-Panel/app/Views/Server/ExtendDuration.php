<?php
include('conn.php');

// for maintainece mode
$sql1 ="select * from onoff where id=1";
$result1 = mysqli_query($conn, $sql1);
$userDetails1 = mysqli_fetch_assoc($result1);

// for ftext and status
$sql2 ="select * from _ftext where id=1";
$result2 = mysqli_query($conn, $sql2);
$userDetails2 = mysqli_fetch_assoc($result2);

// for Features Status
$sql3 = "SELECT * FROM Feature WHERE id=1";
$result3 = mysqli_query($conn, $sql3);
$ModFeatureStatus = mysqli_fetch_assoc($result3);

/* -----------------------------
   Extend ALL Keys (POST)
------------------------------*/
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['extend_keys_form'])) {
    $input = trim($_POST['duration'] ?? '');
    if (preg_match('/^(\d+[HD])$/i', $input, $matches)) {
        $extra_duration = strtoupper($matches[1]);
        preg_match('/^(\d+)([HD])$/', $extra_duration, $d_match);
        $extra_hours = ($d_match[2] === "H") ? (int)$d_match[1] : ((int)$d_match[1] * 24);

        $stmt = $conn->prepare("UPDATE keys_code SET duration = duration + ?");
        $stmt->bind_param("i", $extra_hours);

        if ($stmt->execute()) {
            session()->setFlashdata('message', "✅ All keys extended by {$extra_duration}!");
            session()->setFlashdata('alert-class', 'success');
        } else {
            session()->setFlashdata('message', "❌ Failed to extend keys: " . $stmt->error);
            session()->setFlashdata('alert-class', 'danger');
        }
        $stmt->close();
    } else {
        session()->setFlashdata('message', "❌ Invalid duration format. Use e.g. 30D or 5H");
        session()->setFlashdata('alert-class', 'danger');
    }
}

/* -----------------------------
   Extend SINGLE Key (POST)
------------------------------*/
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['extend_single_form'])) {
    $user_key = trim($_POST['user_key'] ?? '');
    $input    = trim($_POST['duration'] ?? '');

    if ($user_key === '') {
        session()->setFlashdata('message', "❌ Please enter a User Key.");
        session()->setFlashdata('alert-class', 'danger');
    } elseif (!preg_match('/^\d+[HD]$/i', $input)) {
        session()->setFlashdata('message', "❌ Invalid duration format. Use e.g. 30D or 5H");
        session()->setFlashdata('alert-class', 'danger');
    } else {
        $extra_duration = strtoupper($input);
        preg_match('/^(\d+)([HD])$/', $extra_duration, $d_match);
        $extra_hours = ($d_match[2] === "H") ? (int)$d_match[1] : ((int)$d_match[1] * 24);

        $stmt = $conn->prepare("UPDATE keys_code SET duration = duration + ? WHERE user_key = ?");
        $stmt->bind_param("is", $extra_hours, $user_key);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                session()->setFlashdata('message', "✅ Extended key '{$user_key}' by {$extra_hours} hours.");
                session()->setFlashdata('alert-class', 'success');
            } else {
                session()->setFlashdata('message', "⚠️ No key updated. Check if the USER KEY exists.");
                session()->setFlashdata('alert-class', 'warning');
            }
        } else {
            session()->setFlashdata('message', "❌ Failed to extend key: " . $stmt->error);
            session()->setFlashdata('alert-class', 'danger');
        }
        $stmt->close();
    }
}
?>

<?= $this->extend('Layout/Starter') ?>
<?= $this->section('content') ?>

<!-- ✅ Glassmorphism Theme CSS -->
<style>
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
  background: linear-gradient(135deg,#667eea,#764ba2) fixed;
  min-height:100dvh;
}

.glass-page{ width:98%; max-width:1200px; margin: 6px auto 20px; }

.glass-panel{
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 12px; backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 8px 24px rgba(0,0,0,.25); overflow:hidden; transition:.25s;
}
.glass-panel:hover{ transform: translateY(-2px); box-shadow: 0 12px 34px rgba(0,0,0,.35); border-color: rgba(255,255,255,.45); }

.glass-head{
  display:flex; align-items:center; justify-content:space-between; gap:10px;
  padding:14px 16px; background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
  border-bottom:1px solid var(--glass-border); font-weight:700;
}
.glass-head .title{ font-size:17px; letter-spacing:.4px; }
.glass-body{ padding:16px; }

.form-control, .form-select{
  border:none !important; border-radius:8px !important;
  background: rgba(255,255,255,.10) !important; color:#fff !important;
  padding:11px 14px !important; transition:.25s;
}
.form-control::placeholder{ color:#e9e9e9 !important; opacity:.9; }
.form-control:focus, .form-select:focus{
  background: rgba(255,255,255,.18) !important;
  box-shadow: 0 0 0 3px rgba(255,255,255,.25) !important;
  outline:none !important;
}
.form-label{ color:#eaeaff; font-weight:600; font-size:12.5px; }

.btn-glass{
  width:100%; border:none; border-radius:8px; padding:12px;
  font-weight:700; font-size:14px; letter-spacing:.5px;
  color:#fff; cursor:pointer; background: linear-gradient(45deg, var(--primary), var(--secondary));
  transition:.25s;
}
.btn-glass:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

/* Hide bulk controls (not needed here) */
#labula, #hulala{ display:none !important; visibility:hidden !important; height:0 !important; margin:0 !important; padding:0 !important; }

/* 📏 Gap between the two cards */
.card-gap { margin-bottom: 24px; }
@media (min-width: 768px){
  .card-gap { margin-bottom: 28px; }
}
</style>

<div class="glass-page">
  <div class="row">
    <div class="col-lg-12">
      <?= $this->include('Layout/msgStatus') ?>
    </div>
  </div>

  <?php if($user->level != 2) : ?>

  <!-- 🔹 SINGLE KEY EXTEND PANEL -->
  <div class="row card-gap">
    <div class="col-lg-6 mx-auto">
      <div class="glass-panel">
        <div class="glass-head">
          <div class="title"><i class="bi bi-key me-2"></i> Extend Single Key</div>
        </div>
        <div class="glass-body">
          <?= form_open() ?>
            <input type="hidden" name="extend_single_form" value="1">
            <div class="form-group mb-3">
              <label class="form-label">User Key</label>
              <input type="text" name="user_key" class="form-control" placeholder="Enter exact USER KEY" required>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Add Duration</label>
              <input type="text" name="duration" class="form-control" placeholder="e.g. 30D or 12H" required>
              <small class="text-muted">Use <b>nD</b> for days or <b>nH</b> for hours (e.g., 30D, 12H).</small>
            </div>
            <div class="form-group my-2">
              <button type="submit" class="btn-glass">
                <i class="bi bi-clock-history"></i> Extend Key
              </button>
            </div>
          <?= form_close() ?>
        </div>
      </div>
    </div>
  </div>

  <!-- 🔹 ALL KEYS EXTEND PANEL -->
  <div class="row">
    <div class="col-lg-6 mx-auto">
      <div class="glass-panel">
        <div class="glass-head">
          <div class="title"><i class="bi bi-clock-history me-2"></i> Extend All Keys</div>
        </div>
        <div class="glass-body">
          <?= form_open() ?>
            <input type="hidden" name="extend_keys_form" value="1">
            <div class="form-group mb-3">
              <label for="duration" class="form-label">Duration to Add</label>
              <input type="text" 
                     name="duration" 
                     id="duration" 
                     class="form-control" 
                     placeholder="E.g., 30D or 5H" 
                     required>
              <small class="text-muted">Format: Number followed by H (hours) or D (days). Example: 30D = 30 days</small>
            </div>
            <div class="form-group my-2">
              <button type="submit" class="btn-glass">
                <i class="bi bi-clock"></i> Extend All Keys
              </button>
            </div>
          <?= form_close() ?>
        </div>
      </div>
    </div>
  </div>

  <?php endif; ?>
</div>

<?php
  // flash messages for SweetAlert
  $flashMsg   = session()->getFlashdata('message') ?? '';
  $flashClass = session()->getFlashdata('alert-class') ?? ''; // success | danger | warning
?>
<script>
document.addEventListener('DOMContentLoaded', function(){
  var msg  = <?= json_encode($flashMsg,   JSON_UNESCAPED_UNICODE) ?>;
  var kind = <?= json_encode($flashClass, JSON_UNESCAPED_UNICODE) ?>;

  if(!msg) return;

  var icon = (kind === 'success') ? 'success'
           : (kind === 'warning') ? 'warning'
           : 'error';

  if (window.Swal && Swal.fire) {
    Swal.fire({
      title: (icon === 'success') ? 'Done!' : (icon === 'warning' ? 'Note' : 'Failed'),
      text:  msg.replace(/✅|❌|⚠️/g,'').trim(),
      icon:  icon,
      confirmButtonText: 'OK',
      background: 'rgba(20,20,26,.95)',
      color: '#fff',
      backdrop: 'rgba(0,0,0,.75)'
    });
  } else {
    alert(msg.replace(/✅|❌|⚠️/g,'').trim());
  }
});
</script>

<?= $this->endSection() ?>