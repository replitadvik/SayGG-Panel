<?= $this->extend('Layout/Starter') ?>

<?= $this->section('content') ?>
<style>

  :root{
    --glass-bg: rgba(255,255,255,.14);
    --glass-border: rgba(255,255,255,.30);
    --primary:#4facfe; --secondary:#00f2fe;
    --text:#ffffff; --muted:rgba(255,255,255,.75);
    --success:#32d296; --navbar-h:36px;
  }
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');

  body{ font-family:'Poppins',sans-serif; color:var(--text);
        background: linear-gradient(135deg,#667eea,#764ba2) fixed; min-height:100dvh; }

  .glass-page{ width:98%; max-width:1200px; margin: 6px auto 20px; }
  .glass-grid{ display:grid; grid-template-columns: 1.1fr .9fr; gap:14px; }
  @media (max-width: 992px){ .glass-grid{ grid-template-columns: 1fr; } }

  .glass-panel{
    background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 6px;
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 24px rgba(0,0,0,.25); overflow:hidden; transition:.25s;
  }
  .glass-panel:hover{ transform: translateY(-2px); box-shadow: 0 12px 34px rgba(0,0,0,.35); border-color: rgba(255,255,255,.45); }

  .glass-head{ display:flex; align-items:center; justify-content:space-between; gap:10px;
               padding:14px 16px; background: linear-gradient(90deg, rgba(255,255,255,.08), rgba(255,255,255,.02));
               border-bottom:1px solid var(--glass-border); font-weight:700; }
  .glass-head .title{ font-size:17px; letter-spacing:.4px; }
  .glass-body{ padding:16px; }

  .form-control, .form-select{
    border:none !important; border-radius:6px !important;
    background: rgba(255,255,255,.10) !important; color:#fff !important;
    padding:11px 14px !important; transition:.25s;
  }
  .form-control::placeholder{ color:#e9e9e9 !important; opacity:.9; }
  .form-control:focus, .form-select:focus{
    background: rgba(255,255,255,.18) !important; box-shadow: 0 0 0 3px rgba(255,255,255,.25) !important;
    outline:none !important;
  }
  .form-label{ color:#eaeaff; font-weight:600; font-size:12.5px; }
  .form-check-input{ background: rgba(255,255,255,.10); border:1px solid var(--glass-border); }
  .form-check-input:checked{ background-color: var(--secondary); border-color: var(--secondary); }
  .form-check-label{ color:#fff; }

  .btn-ghost{ border:1px solid var(--glass-border); color:#fff; background:transparent; padding:8px 12px; border-radius:8px; }
  .btn-ghost:hover{ border-color:rgba(255,255,255,.45); }
  .btn-glass{
    width:100%; border:none; border-radius:6px; padding:12px;
    font-weight:700; font-size:14px; letter-spacing:.5px;
    color:#fff; cursor:pointer; background: linear-gradient(45deg, var(--primary), var(--secondary));
    transition:.25s;
  }
  .btn-glass:hover{ transform:translateY(-2px); box-shadow:0 6px 16px rgba(0,0,0,.35); }

  /* ===== Modal ===== */
  .glass-modal-backdrop{
    position:fixed; inset:0; background:rgba(0,0,0,.55);
    display:none; align-items:center; justify-content:center; z-index:1050;
  }
  .glass-modal{
    width:min(94vw, 560px); border-radius:6px; overflow:hidden;
    background: var(--glass-bg); border:1px solid var(--glass-border);
    box-shadow: 0 18px 48px rgba(0,0,0,.55); backdrop-filter: blur(16px);
    transform: translateY(12px); opacity:0; transition:.25s;
  }
  .glass-modal.show{ transform: translateY(0); opacity:1; }

  .modal-top{ background: rgba(20,20,26,.85);
    padding:14px 16px; display:flex; align-items:center; justify-content:space-between; }
  .modal-title{ font-weight:700; font-size:18px; display:flex; align-items:center; gap:10px; }
  .success-dot{ width:12px; height:12px; border-radius:50%; background: var(--success); box-shadow:0 0 0 3px rgba(50,210,150,.25); }
  .modal-close{ border:none; background:transparent; color:#fff; font-size:22px; line-height:1; cursor:pointer; }

  .glass-modal-body{ padding:14px 16px; background: rgba(255,255,255,.04); }
  .kv{ display:grid; grid-template-columns: 140px 1fr; gap:6px 8px; font-size:14px; color:var(--muted); }
  .kv strong{ color:#fff; font-weight:600; }
  .hr{ height:1px; background: rgba(255,255,255,.18); margin:12px 0; }

  .keys-label{ display:flex; align-items:center; justify-content:space-between; font-weight:700; }
  .keys-count{ color:var(--muted); font-weight:600; font-size:13px; }
  .keys-box{
    background:#070a0a; color:#3CFF93; border:1px solid rgba(255,255,255,.15);
    border-radius:6px; padding:12px 14px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    min-height:50px; max-height:100px; overflow:auto; white-space: pre-wrap; font-size:14px;
  }

  .glass-modal-actions{
    padding:12px 16px; display:flex; gap:10px; align-items:center; justify-content:space-between;
    background: rgba(255,255,255,.04);
  }
  .btn-outline{
    background:transparent; color:#fff; border:1px solid var(--glass-border);
    border-radius:6px; padding:10px 14px; font-weight:600;
  }
  .btn-outline:hover{ border-color:rgba(255,255,255,.45); }
  .btn-dark{
    background: rgba(20,20,26,.9); color:#fff; border:none; border-radius:6px; padding:12px 16px; font-weight:700;
  }
  .copy-tag{ color:#c7ffe9; font-size:12px; margin-left:8px; display:none; }

  .show-flex{ display:flex !important; }
  @media (max-width:768px){ .glass-page{ width:99%; } }
  
</style>

<div class="glass-page">
  <?= $this->include('Layout/msgStatus') ?>

  <div class="glass-grid">
    <!-- LEFT: CREATE LICENSE -->
    <div class="glass-panel">
      <div class="glass-head">
        <div class="title"><i class="bi bi-key-fill me-2"></i>Create License</div>
        <a class="btn-ghost" href="<?= site_url('keys') ?>"><i class="bi bi-people"></i> View Keys</a>
      </div>
      <div class="glass-body">
        <?= form_open() ?>
          <div class="row">
            <div class="form-group col-lg-6 mb-3">
              <label for="game" class="form-label">Game</label>
              <?= form_dropdown(['class' => 'form-select', 'name' => 'game', 'id' => 'game'], $game, old('game') ?: '') ?>
              <?php if ($validation->hasError('game')) : ?>
                <small class="text-danger"><?= $validation->getError('game') ?></small>
              <?php endif; ?>
            </div>
            <div class="form-group col-lg-6 mb-3">
              <label for="max_devices" class="form-label">Max Devices</label>
              <input type="number" name="max_devices" id="max_devices" class="form-control" placeholder="1" value="<?= old('max_devices') ?: 1 ?>">
              <?php if ($validation->hasError('max_devices')) : ?>
                <small class="text-danger"><?= $validation->getError('max_devices') ?></small>
              <?php endif; ?>
            </div>
          </div>

          <div class="form-group mb-3">
            <label for="duration" class="form-label">Duration</label>
            <?= form_dropdown(['class' => 'form-select', 'name' => 'duration', 'id' => 'duration'], $duration, old('duration') ?: '') ?>
            <?php if ($validation->hasError('duration')) : ?>
              <small class="text-danger"><?= $validation->getError('duration') ?></small>
            <?php endif; ?>
          </div>

        <?php if ($user->level == 1 || $user->level == 2): ?>
            <div class="form-check mb-3">
                <input 
                    class="form-check-input" 
                    type="checkbox" 
                    name="check" 
                    id="check" 
                    onchange="fupi(this)"
                >
                <label class="form-check-label" for="check">
                    Custom Key
                </label>
            </div>
        <?php endif; ?>

          <div id="customBlock" style="display:none;">
            <div class="form-group mb-3">
              <label for="custom" class="form-label">Input Your Key</label>
              <input type="text" minlength="4" maxlength="16" name="cuslicense" class="form-control" id="custom">
            </div>
          </div>

          <!-- Bulk system fully removed -->

          <input type="text" id="textinput" name="custominput" hidden>

          <div class="form-group mb-4">
            <label for="estimation" class="form-label">Estimation</label>
            <input type="text" id="estimation" class="form-control" placeholder="Your order will total" readonly>
          </div>

          <button type="submit" class="btn-glass">
            <i class="bi bi-key me-2"></i> Generate License
          </button>
        <?= form_close() ?>
      </div>
    </div>

    <!-- RIGHT: Info / Help -->
    <div class="glass-panel">
      <div class="glass-head"><div class="title"><i class="bi bi-info-circle me-2"></i>Tips</div></div>
      <div class="glass-body" style="color:var(--muted);font-size:14px;">
        Price = <em>devices × unit price (duration)</em>.  
        After generation, a popup opens with your key; you can copy or download it.
      </div>
    </div>
  </div>
</div>

<!-- ===== MODAL ===== -->
<div id="licenseModalBackdrop" class="glass-modal-backdrop">
  <div class="glass-modal" id="licenseModal">
    <div class="modal-top">
      <div class="modal-title"><span class="success-dot"></span> Key Generated Successfully!</div>
      <button class="modal-close" onclick="closeModal()">×</button>
    </div>

    <div class="glass-modal-body">
      <div class="kv">
        <div>🎮 <strong>Game:</strong></div>         <div id="mGame">-</div>
        <div>⏱ <strong>Duration:</strong></div>     <div id="mDuration">-</div>
        <div>📱 <strong>Max Devices:</strong></div>  <div id="mDevices">-</div>
        <div>$ <strong>Total Cost:</strong></div>    <div id="mCost">-</div>
      </div>

      <div class="hr"></div>

      <div class="keys-label">
        <div>🔑 Generated Key:</div>
        <div class="keys-count" id="mCount">1 key</div>
      </div>
      <div id="keysBox" class="keys-box"></div>
    </div>

    <div class="glass-modal-actions">
      <div>
        <button class="btn-outline" onclick="copyAll()"><i class="bi bi-clipboard"></i> Copy Key <span id="copiedTag" class="copy-tag">Copied!</span></button>
        <button class="btn-outline" onclick="downloadKeys()"><i class="bi bi-download"></i> Download Key</button>
      </div>
      <button class="btn-dark" onclick="closeModal()"><i class="bi bi-x-circle"></i> Close</button>
    </div>
  </div>
</div>

<script>
  // ===== Price Estimation (devices × unit) =====
  $(document).ready(function() {

    var price = JSON.parse('<?= $price ?>');
    
    $("#customBlock").hide();
    $("#textinput").val("auto");

    updatePrice();
    $("#max_devices, #duration, #game").on("change keyup", updatePrice);

    function updatePrice(){
      var device = parseInt($("#max_devices").val() || 1, 10);
      var durate = $("#duration").val();
      var unit   = Number(price[durate]);

      if (isNaN(device) || device < 1) device = 1;

      if(!isNaN(unit)){
        var total = device * unit;
        $("#estimation").val(total.toFixed(2));
      }else{
        $("#estimation").val('Estimation error');
      }
    }

  });

  // ===== Custom Key Toggle =====
  function fupi(obj) {
    if($(obj).is(":checked")){
      $("#customBlock").stop(true,true).slideDown(200);
      $("#textinput").val("custom");
    } else {
      $("#customBlock").stop(true,true).slideUp(200);
      $("#textinput").val("auto");
    }
  }

  // ===== Modal Open on Flashdata =====
  <?php
    $fk     = session()->getFlashdata('user_key');
    $f_game = session()->getFlashdata('game');
    $f_dur  = session()->getFlashdata('duration');
    $f_dev  = session()->getFlashdata('max_devices');
    $f_cost = session()->getFlashdata('total_cost');
  ?>

  const flashKey   = <?= json_encode($fk ?? null) ?>;
  const flashGame  = <?= json_encode($f_game ?? null) ?>;
  const flashDur   = <?= json_encode($f_dur ?? null) ?>;
  const flashDev   = <?= json_encode($f_dev ?? null) ?>;
  const flashTotal = <?= json_encode($f_cost ?? null) ?>;

  document.addEventListener('DOMContentLoaded', function(){

    if(flashKey){

      let keyText = String(flashKey).trim();

      try{
        const priceMap = JSON.parse('<?= $price ?>');
        const unit = Number(priceMap[flashDur]);
        const computed = (!isNaN(unit)
          ? Number((Number(flashDev||1) * unit).toFixed(2))
          : null);

        const finalCost = (flashTotal && !isNaN(Number(flashTotal)))
          ? Number(Number(flashTotal).toFixed(2))
          : computed;

        openModal({
          game: flashGame,
          dur: flashDur,
          dev: flashDev,
          cost: finalCost,
          key: keyText
        });

      }catch(e){
        openModal({
          game: flashGame,
          dur: flashDur,
          dev: flashDev,
          key: keyText
        });
      }
    }
  });

  function openModal(meta){

    document.getElementById('mGame').textContent =
      meta.game ?? '-';

    document.getElementById('mDuration').textContent =
      meta.dur ? (meta.dur + (isNaN(meta.dur) ? '' : ' Hours')) : '-';

    document.getElementById('mDevices').textContent =
      meta.dev ?? '-';

    document.getElementById('mCost').textContent =
      (meta.cost!=null && !isNaN(meta.cost))
        ? ('$ ' + Number(meta.cost).toFixed(2))
        : '-';

    const keysBox = document.getElementById('keysBox');
    keysBox.textContent = meta.key ?? '';

    document.getElementById('mCount').textContent = '1 key';

    const backdrop = document.getElementById('licenseModalBackdrop');
    const modal    = document.getElementById('licenseModal');

    backdrop.classList.add('show-flex');

    setTimeout(()=>{
      modal.classList.add('show');
    }, 10);

    copyAll(true);
  }

  function closeModal(){
    const backdrop = document.getElementById('licenseModalBackdrop');
    const modal = document.getElementById('licenseModal');

    modal.classList.remove('show');

    setTimeout(()=>{
      backdrop.classList.remove('show-flex');
    }, 200);
  }

  function copyAll(silent=false){

    const box = document.getElementById('keysBox');

    const range = document.createRange();
    range.selectNodeContents(box);

    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    document.execCommand('copy');
    sel.removeAllRanges();

    if(!silent){
      const tag = document.getElementById('copiedTag');
      tag.style.display = 'inline';
      setTimeout(()=> tag.style.display='none', 1500);
    }
  }

  function downloadKeys(){
    const key = document.getElementById('keysBox').textContent.trim();
    if(!key) return;

    const blob = new Blob([key + '\n'], {type: 'text/plain'});
    const url  = URL.createObjectURL(blob);

    const a = document.createElement('a');
    const ts = new Date().toISOString().slice(0,10);

    a.href = url;
    a.download = `key-${ts}.txt`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }
</script>
<?= $this->endSection() ?>
