<?= $this->extend('Layout/Starter') ?>

<?= $this->section('css') ?>
<style>
  /* ===== FIRST THEME — GLASSMORPHISM (consistent layout) ===== */
  :root{
    --glass-bg: rgba(255,255,255,.14);
    --glass-border: rgba(255,255,255,.30);
    --primary:#4facfe; --secondary:#00f2fe;
    --text:#ffffff; --muted:rgba(255,255,255,.75);
    --success:#32d296; --danger:#ff6b6b; --warning:#ffc107; --info:#0dcaf0;
  }
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

  body{
    font-family:'Poppins',sans-serif; color:var(--text);
    background:
      radial-gradient(1200px 800px at 10% 10%, rgba(79,172,254,.18), transparent 35%),
      radial-gradient(1200px 800px at 90% 90%, rgba(0,242,254,.16), transparent 35%),
      linear-gradient(135deg,#667eea,#764ba2) fixed;
    min-height:100dvh;
  }

  .glass-page{ width:98%; max-width:900px; margin:12px auto 20px; }

  .glass-panel{
    background: var(--glass-bg); border:1px solid var(--glass-border); border-radius:12px;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,.25); overflow:hidden; position:relative;
  }
  .glass-panel:hover{ transform: translateY(-1px); box-shadow:0 12px 34px rgba(0,0,0,.35); border-color:rgba(255,255,255,.45); }

  .glass-panel::before{
    content:""; position:absolute; inset:0;
    background: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px);
    background-size:100% 4px; pointer-events:none; opacity:.2;
  }

  .glass-head{
    display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:12px 16px; background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
    border-bottom:1px solid var(--glass-border); text-shadow:0 0 8px rgba(0,242,255,.35);
  }
  .glass-head .title{ font-weight:700; letter-spacing:.4px; font-size:17px; display:flex; align-items:center; gap:8px; }
  .glass-body{ padding:16px; }

  /* Form controls (same look as your first theme) */
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

  .badge-chip{
    padding:6px 10px; border-radius:999px;
    border:1px solid var(--glass-border); background:rgba(0,0,0,.28); color:#fff;
    font-size:12.5px; font-weight:600;
  }

  .btn-grad{
    width:100%; border:none; border-radius:10px; padding:12px;
    font-weight:700; font-size:14px; letter-spacing:.5px;
    color:#fff; cursor:pointer; background: linear-gradient(45deg, var(--primary), var(--secondary));
    transition:.25s;
  }
  .btn-grad:disabled{ opacity:.6; cursor:not-allowed; }
  .btn-grad:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

  .btn-ghost{ border:1px solid var(--glass-border); color:#fff; background:transparent; padding:8px 12px; border-radius:10px; }
  .btn-ghost:hover{ border-color:rgba(255,255,255,.45); }

  .text-muted{ color:var(--muted)!important; }
</style>
<?= $this->endSection() ?>

<?= $this->section('content') ?>
<div class="glass-page">
  <?= $this->include('Layout/msgStatus') ?>

  <div class="glass-panel">
    <div class="glass-head">
      <div class="title">
        <i class="bi bi-key-fill"></i> Key Information
      </div>
      <div class="d-flex align-items-center gap-2">
        <a href="<?= site_url('keys/generate') ?>" class="btn-ghost btn-sm" title="Generate New Key">
          <i class="bi bi-person-plus"></i>
        </a>
        <a href="<?= site_url('keys') ?>" class="btn-ghost btn-sm" title="All Keys">
          <i class="bi bi-people"></i>
        </a>
      </div>
    </div>

    <div class="glass-body">
      <?= form_open('keys/edit') ?>
      <input type="hidden" name="id_keys" value="<?= $key->id_keys ?>">

      <div class="row">
        <?php if (($user->level == 1) || ($user->level == 2)) : ?>
          <div class="col-md-6 mb-3">
            <label for="game" class="form-label">Game</label>
            <input type="text" name="game" id="game" class="form-control"
                   value="<?= old('game') ?: $key->game ?>" placeholder="Game name">
            <?php if ($validation->hasError('game')) : ?>
              <small class="text-danger"><?= $validation->getError('game') ?></small>
            <?php endif; ?>
          </div>

          <div class="col-md-6 mb-3">
            <label for="user_key" class="form-label">License Key</label>
            <input type="text" name="user_key" id="user_key" class="form-control"
                   value="<?= old('user_key') ?: $key->user_key ?>" placeholder="RandomKey">
            <?php if ($validation->hasError('user_key')) : ?>
              <small class="text-danger"><?= $validation->getError('user_key') ?></small>
            <?php endif; ?>
          </div>

          <div class="col-md-6 mb-3">
            <label for="duration" class="form-label">Duration <small class="text-muted">(hours)</small></label>
            <input type="number" name="duration" id="duration" class="form-control"
                   value="<?= old('duration') ?: $key->duration ?>" placeholder="3">
            <?php if ($validation->hasError('duration')) : ?>
              <small class="text-danger"><?= $validation->getError('duration') ?></small>
            <?php endif; ?>
          </div>

          <div class="col-md-6 mb-3">
            <label for="max_devices" class="form-label">Max Devices</label>
            <input type="number" name="max_devices" id="max_devices" class="form-control"
                   value="<?= old('max_devices') ?: $key->max_devices ?>" placeholder="3">
            <?php if ($validation->hasError('max_devices')) : ?>
              <small class="text-danger"><?= $validation->getError('max_devices') ?></small>
            <?php endif; ?>
          </div>
        <?php endif; ?>

        <div class="col-md-6 mb-3">
          <label for="status" class="form-label">Status</label>
          <?php $sel_status = ['' => '— Select Status —', '0' => 'Banned/Block', '1' => 'Active']; ?>
          <?= form_dropdown(['class' => 'form-select', 'name' => 'status', 'id' => 'status'], $sel_status, $key->status) ?>
          <?php if ($validation->hasError('status')) : ?>
            <small class="text-danger"><?= $validation->getError('status') ?></small>
          <?php endif; ?>
        </div>

        <div class="col-md-6 mb-3">
          <label for="registrator" class="form-label">Registrator</label>
          <input type="text" name="registrator" id="registrator" class="form-control"
                 value="<?= old('registrator') ?: $key->registrator ?>" placeholder="nata">
          <?php if ($validation->hasError('registrator')) : ?>
            <small class="text-danger"><?= $validation->getError('registrator') ?></small>
          <?php endif; ?>
        </div>

        <div class="col-12 mb-3">
          <label for="expired_date" class="form-label">
            Expiration <?= !$key->expired_date ? '<span class="text-muted">(Not started yet)</span>' : '' ?>
          </label>
          <input type="text" name="expired_date" id="expired_date" class="form-control"
                 value="<?= old('expired_date') ?: $key->expired_date ?>" placeholder="<?= $time::now() ?>">
          <?php if ($validation->hasError('expired_date')) : ?>
            <small class="text-danger"><?= $validation->getError('expired_date') ?></small>
          <?php endif; ?>
        </div>

        <div class="col-12 mb-4">
          <label for="devices" class="form-label d-flex align-items-center gap-2">
            Devices
            <span class="badge-chip" id="devBadge"><?= $key_info->total ?>/<?= $key->max_devices ?></span>
            <small class="text-muted">(Separate with new lines)</small>
          </label>
          <textarea class="form-control" name="devices" id="devices"
                    rows="<?= ($key_info->total > $key->max_devices) ? 3 : max($key_info->total, 3) ?>"
                    style="min-height:100px"><?= old('devices') ?: ($key_info->total ? $key_info->devices : '') ?></textarea>
          <?php if ($validation->hasError('devices')) : ?>
            <small class="text-danger"><?= $validation->getError('devices') ?></small>
          <?php endif; ?>
        </div>

        <div class="col-12">
          <button type="submit" class="btn-grad" id="updateBtn" disabled>
            <i class="bi bi-save me-1"></i> Update Key
          </button>
        </div>
      </div>
      <?= form_close() ?>
    </div>
  </div>
</div>
<?= $this->endSection() ?>

<?= $this->section('js') ?>
<script>
  $(document).ready(function () {
    // Lock fields based on user level
    var level = "<?= $user->level ?>";
    if (level != 1) {
      $("#registrator, #expired_date, #devices").attr('disabled', true);
    }

    // Enable update button on any change
    $("input, select, textarea").on("input change", function () {
      $("#updateBtn").prop('disabled', false);
    });

    // Update device badge and textarea rows when max_devices changes
    var total = "<?= $key_info->total ?>";
    $("#max_devices").on("input change", function () {
      var maxVal = Number($(this).val() || 0);
      $("#devBadge").text(total + "/" + (maxVal || 0));
      if (maxVal > 0) {
        $("#devices").attr('rows', Math.max(total, 3));
      }
    });
  });
</script>
<?= $this->endSection() ?>