<?php
include('conn.php');
include('mail.php');

// for maintenance mode
$sql1 = "select * from onoff where id=1";
$result1 = mysqli_query($conn, $sql1);
$userDetails1 = mysqli_fetch_assoc($result1);

// for ftext and status
$sql2 = "select * from _ftext where id=1";
$result2 = mysqli_query($conn, $sql2);
$userDetails2 = mysqli_fetch_assoc($result2);

// for Features Status
$sql3 = "SELECT * FROM Feature WHERE id=1";
$result3 = mysqli_query($conn, $sql3);
$ModFeatureStatus = mysqli_fetch_assoc($result3);
?>

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

  /* Card -> Glass Panel */
  .cyber-card{
    background: var(--glass-bg);
    border:1px solid var(--glass-border);
    border-radius:12px;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,.25);
    overflow:hidden; margin-bottom:20px; transition:.25s;
    position:relative;
  }
  .cyber-card:hover{
    transform: translateY(-2px);
    box-shadow: 0 12px 34px rgba(0,0,0,.35);
    border-color: rgba(255,255,255,.45);
  }
  .cyber-card::before{
    content:""; position:absolute; inset:0; pointer-events:none;
    background: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
    background-size:100% 4px; opacity:.18;
  }

  /* Header */
  .cyber-header{
    display:flex; align-items:center; justify-content:space-between; gap:10px;
    padding:14px 16px;
    background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
    border-bottom:1px solid var(--glass-border);
    font-weight:700; letter-spacing:.4px;
    color:#eafcff; text-shadow:0 0 8px rgba(0,242,255,.35);
  }

  /* Body */
  .cyber-body{ padding:16px; }

  /* Labels & Inputs -> Glass Controls */
  .cyber-label{ color:#eaeaff; font-weight:600; font-size:12.5px; margin-bottom:.5rem; display:block; }
  .status-text{ color:var(--muted); font-size:.92rem; }

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

  /* Switch (kept markup, glass style) */
  .cyber-switch{ position:relative; display:inline-block; width:60px; height:30px; }
  .cyber-switch input{ opacity:0; width:0; height:0; }
  .cyber-slider{
    position:absolute; cursor:pointer; inset:0;
    background: rgba(255,255,255,.10);
    border:1px solid var(--glass-border);
    border-radius:34px; transition:.35s;
  }
  .cyber-slider:before{
    content:""; position:absolute; height:22px; width:22px; left:4px; bottom:4px;
    background: linear-gradient(45deg, var(--primary), var(--secondary));
    border-radius:50%; transition:.35s;
  }
  .cyber-switch input:checked + .cyber-slider{
    background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.45);
    box-shadow: inset 0 0 0 3px rgba(255,255,255,.08);
  }
  .cyber-switch input:checked + .cyber-slider:before{ transform: translateX(28px); }

  /* Feature grid rows */
  .feature-grid{
    display:grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
    gap:14px; margin-bottom:12px;
  }
  .feature-item{ display:flex; align-items:center; justify-content:space-between; padding:6px 0; }
  .feature-name{ color:#fff; font-weight:600; }

  /* Button -> Glass Gradient */
  .cyber-btn{
    display:inline-flex; align-items:center; justify-content:center; gap:.5rem;
    width:100%; border:none; border-radius:10px; padding:12px;
    font-weight:700; font-size:14px; letter-spacing:.5px; color:#fff;
    cursor:pointer; background: linear-gradient(45deg, var(--primary), var(--secondary));
    transition:.25s; text-transform:none;
  }
  .cyber-btn:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }
</style>

<div class="container-fluid py-4">
  <div class="row">
    <div class="col-lg-12">
      <?= $this->include('Layout/msgStatus') ?>
    </div>

    <?php if($user->level != 2) : ?>
    <div class="col-lg-6">
      <div class="cyber-card">
        <div class="cyber-header">Server Based Mode</div>
        <div class="cyber-body">
          <?= form_open() ?>
            <input type="hidden" name="status_form" value="1">

            <label class="cyber-label">
              Current Maintenance Mode:
              <span class="status-text"><?= $userDetails1['status']; ?></span>
            </label>

            <div class="feature-item">
              <span class="feature-name">Maintenance Mode</span>
              <label class="cyber-switch">
                <input type="checkbox" name="radios" id="radio" value="on" <?= ($userDetails1['status']=="on")?'checked':'' ?>>
                <span class="cyber-slider"></span>
              </label>
            </div>

            <label class="cyber-label">
              Offline Message:
              <span class="status-text"><?= $userDetails1['myinput']; ?></span>
            </label>

            <textarea class="cyber-input cyber-textarea" name="myInput" id="myInput" placeholder="Server is under maintenance"></textarea>

            <button type="submit" class="cyber-btn">Update</button>
          <?= form_close() ?>
        </div>
      </div>
    </div>
    <?php endif; ?>

    <div class="col-lg-6">
      <div class="cyber-card">
        <div class="cyber-header">Mod Features</div>
        <div class="cyber-body">
          <?= form_open() ?>
            <input type="hidden" name="feature_form" value="1">

            <label class="cyber-label">
              Current Status:
              <span class="status-text">
                ESP - <?= $ModFeatureStatus['ESP']; ?> |
                Items - <?= $ModFeatureStatus['Item']; ?> |
                AIM - <?= $ModFeatureStatus['AIM']; ?> |
                SilentAim - <?= $ModFeatureStatus['SilentAim']; ?> |
                BulletTrack - <?= $ModFeatureStatus['BulletTrack']; ?> |
                Memory - <?= $ModFeatureStatus['Memory']; ?> |
                Floating - <?= $ModFeatureStatus['Floating']; ?> |
                Setting - <?= $ModFeatureStatus['Setting']; ?>
              </span>
            </label>

            <div class="feature-grid">
              <div class="feature-item">
                <span class="feature-name">ESP</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="ESP" id="ESP" value="on" <?= ($ModFeatureStatus['ESP']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>

              <div class="feature-item">
                <span class="feature-name">Items</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="Item" id="Item" value="on" <?= ($ModFeatureStatus['Item']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>

              <div class="feature-item">
                <span class="feature-name">Aim-Bot</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="AIM" id="AIM" value="on" <?= ($ModFeatureStatus['AIM']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>

              <div class="feature-item">
                <span class="feature-name">Silent Aim</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="SilentAim" id="SilentAim" value="on" <?= ($ModFeatureStatus['SilentAim']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>

              <div class="feature-item">
                <span class="feature-name">Bullet Track</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="BulletTrack" id="BulletTrack" value="on" <?= ($ModFeatureStatus['BulletTrack']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>

              <div class="feature-item">
                <span class="feature-name">Memory</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="Memory" id="Memory" value="on" <?= ($ModFeatureStatus['Memory']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>

              <div class="feature-item">
                <span class="feature-name">Floating Texts</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="Floating" id="Floating" value="on" <?= ($ModFeatureStatus['Floating']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>

              <div class="feature-item">
                <span class="feature-name">Settings</span>
                <label class="cyber-switch">
                  <input type="checkbox" name="Setting" id="Setting" value="on" <?= ($ModFeatureStatus['Setting']=="on")?'checked':'' ?>>
                  <span class="cyber-slider"></span>
                </label>
              </div>
            </div>

            <button type="submit" class="cyber-btn">Update Features</button>
          <?= form_close() ?>
        </div>
      </div>
    </div>

    <div class="col-lg-6">
      <div class="cyber-card">
        <div class="cyber-header">Change Mod Name</div>
        <div class="cyber-body">
          <?= form_open() ?>
            <input type="hidden" name="modname_form" value="1">

            <label class="cyber-label">
              Current Mod Name:
              <span class="status-text"><?= $row['modname']; ?></span>
            </label>

            <input type="text" name="modname" id="modname" class="cyber-input" placeholder="Enter your new Mod name" required>

            <button type="submit" class="cyber-btn">Update Name</button>
          <?= form_close() ?>
        </div>
      </div>
    </div>

    <div class="col-lg-6">
      <div class="cyber-card">
        <div class="cyber-header">Change Floating Text</div>
        <div class="cyber-body">
          <?= form_open() ?>
            <input type="hidden" name="_ftext" value="1">

            <label class="cyber-label">
              Current Mod Status:
              <span class="status-text"><?= $userDetails2['_status']; ?></span>
            </label>

            <div class="feature-item">
              <span class="feature-name">Safe Mode</span>
              <label class="cyber-switch">
                <input type="checkbox" name="_ftextr" id="_ftextr" value="Safe" <?= ($userDetails2['_status']=="Safe")?'checked':'' ?>>
                <span class="cyber-slider"></span>
              </label>
            </div>

            <label class="cyber-label">
              Current Floating Text:
              <span class="status-text"><?= $userDetails2['_ftext']; ?></span>
            </label>

            <input type="text" name="_ftext" id="_ftext" class="cyber-input" placeholder="Give feedback else key removed!" required>

            <button type="submit" class="cyber-btn">Update Text</button>
          <?= form_close() ?>
        </div>
      </div>
    </div>

  </div>
</div>

<?= $this->endSection() ?>