<?php
// Improve database connection handling
include('conn.php');

// Add connection error handling
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

// For Credits
$sql = "SELECT * FROM credit where id=1";
$result = mysqli_query($conn, $sql);
$credit = mysqli_fetch_assoc($result);
mysqli_free_result($result);

// For Keys count
$sql = "SELECT COUNT(*) as id_keys FROM keys_code";
$result = mysqli_query($conn, $sql);
$keycount = mysqli_fetch_assoc($result);
mysqli_free_result($result);

// For Active Keys count
$sql = "SELECT COUNT(devices) as devices FROM keys_code";
$result = mysqli_query($conn, $sql);
$active = mysqli_fetch_assoc($result);
mysqli_free_result($result);

// For In-Active Keys Count
$sql = "SELECT COUNT(*) as devices FROM keys_code where devices IS NULL";
$result = mysqli_query($conn, $sql);
$inactive = mysqli_fetch_assoc($result);
mysqli_free_result($result);

// For Users Count
$sql = "SELECT COUNT(*) as id_users FROM users";
$result = mysqli_query($conn, $sql);
$users = mysqli_fetch_assoc($result);
mysqli_free_result($result);

// Blocked key count
$sql = "SELECT COUNT(*) as id_keys FROM keys_code WHERE status = '0'";
$result = mysqli_query($conn, $sql);
$blockCount = mysqli_fetch_assoc($result)['id_keys'] ?? 0;
mysqli_free_result($result);

// Banned/block users
$sql = "SELECT COUNT(*) as id_users FROM users WHERE status = '2'";
$result = mysqli_query($conn, $sql);
$banusers = mysqli_fetch_assoc($result)['id_users'] ?? 0;
mysqli_free_result($result);

// Total Owner
$sql = "SELECT COUNT(*) as id_users FROM users WHERE level = '1'";
$result = mysqli_query($conn, $sql);
$ownerusers = mysqli_fetch_assoc($result)['id_users'] ?? 0;
mysqli_free_result($result);

// Total Admin
$sql = "SELECT COUNT(*) as id_users FROM users WHERE level = '2'";
$result = mysqli_query($conn, $sql);
$adminusers = mysqli_fetch_assoc($result)['id_users'] ?? 0;
mysqli_free_result($result);

// Total Reseller
$sql = "SELECT COUNT(*) as id_users FROM users WHERE level = '3'";
$result = mysqli_query($conn, $sql);
$resellerusers = mysqli_fetch_assoc($result)['id_users'] ?? 0;
mysqli_free_result($result);

$userid = session()->userid;
$sql = "SELECT `expiration_date` FROM `users` WHERE `id_users` = ?";
$stmt = mysqli_prepare($conn, $sql);
mysqli_stmt_bind_param($stmt, "s", $userid);
mysqli_stmt_execute($stmt);
$result = mysqli_stmt_get_result($stmt);
$period = mysqli_fetch_assoc($result);
mysqli_stmt_close($stmt);

// Close the connection when done with all queries
mysqli_close($conn);

function HoursToDays($value)
{
    if($value == 1) {
       return "$value Hour";
    } else if($value >= 2 && $value < 24) {
       return "$value Hours";
    } else if($value == 24) {
       $darkespyt = $value/24;
       return "$darkespyt Day";
    } else if($value > 24) {
       $darkespyt = $value/24;
       return "$darkespyt Days";
    }
}

$dateTime = strtotime($period['expiration_date']);
$getDateTime = date("F d, Y H:i:s", $dateTime);
?>

<?= $this->extend('Layout/Starter') ?>
<?= $this->section('content') ?>
<style>
  /* ========= PREMIUM DARK SAAS DASHBOARD ========= */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap');

  :root {
    --bg-root: #09090b;
    --bg-surface: #111113;
    --bg-card: #16161a;
    --bg-card-hover: #1c1c21;
    --bg-elevated: #1e1e24;
    --border-subtle: rgba(255,255,255,0.06);
    --border-default: rgba(255,255,255,0.08);
    --border-hover: rgba(255,255,255,0.14);
    --text-primary: #fafafa;
    --text-secondary: #a1a1aa;
    --text-muted: #71717a;
    --accent: #3b82f6;
    --accent-hover: #60a5fa;
    --accent-muted: rgba(59,130,246,0.12);
    --green: #22c55e;
    --green-muted: rgba(34,197,94,0.12);
    --red: #ef4444;
    --red-muted: rgba(239,68,68,0.12);
    --amber: #f59e0b;
    --amber-muted: rgba(245,158,11,0.12);
    --radius: 12px;
    --radius-sm: 8px;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg-root);
    color: var(--text-primary);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    min-height: 100dvh;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* === Layout === */
  .dashboard-container {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    padding: 32px 24px 48px;
  }

  .dashboard-header {
    margin-bottom: 32px;
  }
  .dashboard-header h1 {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    color: var(--text-primary);
  }
  .dashboard-header p {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 4px;
  }

  /* === Grid === */
  .row { display: flex; flex-wrap: wrap; gap: 16px; }
  .row + .row { margin-top: 16px; }

  .col-lg-12 { width: 100%; }
  .col-lg-8 { width: 100%; }
  .col-lg-4 { width: 100%; }

  @media (min-width: 1024px) {
    .col-lg-8 { width: calc(66.666% - 8px); }
    .col-lg-4 { width: calc(33.333% - 8px); }
  }

  .col-md-3 { width: calc(50% - 12px); }
  .col-sm-6 { }

  @media (min-width: 768px) {
    .col-md-3 { width: calc(25% - 12px); }
  }

  @media (max-width: 480px) {
    .col-md-3 { width: 100%; }
    .dashboard-container { padding: 20px 16px 32px; }
  }

  /* === Cards === */
  .card {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-default) !important;
    border-radius: var(--radius) !important;
    overflow: hidden;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    position: relative;
  }
  .card:hover {
    border-color: var(--border-hover) !important;
    box-shadow: 0 0 0 1px var(--border-subtle), 0 8px 40px rgba(0,0,0,0.3);
  }

  .card-header {
    background: transparent !important;
    border-bottom: 1px solid var(--border-subtle) !important;
    color: var(--text-secondary) !important;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 14px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .card-header i {
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .card-body { padding: 20px; }

  /* === Stat Cards === */
  .stat-card {
    text-align: left;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 130px;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  .stat-icon.blue    { background: var(--accent-muted); color: var(--accent); }
  .stat-icon.green   { background: var(--green-muted);  color: var(--green); }
  .stat-icon.amber   { background: var(--amber-muted);  color: var(--amber); }
  .stat-icon.red     { background: var(--red-muted);    color: var(--red); }

  .stat-content { display: flex; flex-direction: column; gap: 2px; }

  .stat-value {
    font-size: 1.75rem;
    font-weight: 800;
    letter-spacing: -0.025em;
    color: var(--text-primary);
    line-height: 1;
  }
  .stat-label {
    font-size: 0.8rem;
    color: var(--text-muted);
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  /* === Expiration Timer === */
  .timer-grid {
    display: flex;
    justify-content: center;
    gap: 12px;
    padding: 8px 0;
  }
  .timer-segment {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .timer-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 2rem;
    font-weight: 700;
    color: var(--text-primary);
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    border-radius: var(--radius-sm);
    min-width: 64px;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: -0.02em;
    line-height: 1;
  }
  .timer-unit {
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .timer-separator {
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-muted);
    align-self: flex-start;
    padding-top: 18px;
  }
  #exp {
    font-family: 'JetBrains Mono', monospace;
    text-align: center;
    color: var(--text-primary);
    font-size: 1.6rem;
    font-weight: 700;
    margin: 0;
  }
  .expired-label {
    color: var(--red);
    font-family: 'JetBrains Mono', monospace;
    font-size: 1.2rem;
    font-weight: 700;
    text-align: center;
    letter-spacing: 0.15em;
    text-transform: uppercase;
  }

  @media (max-width: 480px) {
    .timer-value { font-size: 1.5rem; min-width: 52px; height: 52px; }
    .timer-separator { font-size: 1.2rem; padding-top: 14px; }
  }

  /* === List / Info Items === */
  .list-group { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px; }
  .list-group-item {
    background: var(--bg-elevated) !important;
    border: 1px solid var(--border-subtle) !important;
    color: var(--text-primary) !important;
    border-radius: var(--radius-sm) !important;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background 0.15s ease, border-color 0.15s ease;
    font-size: 0.875rem;
  }
  .list-group-item:hover {
    background: var(--bg-card-hover) !important;
    border-color: var(--border-hover) !important;
  }
  .list-group-item span:first-child {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--text-secondary);
    font-weight: 500;
  }
  .list-group-item span:first-child i {
    color: var(--text-muted);
    font-size: 0.9rem;
  }

  .badge {
    padding: 5px 12px;
    border-radius: 999px;
    background: var(--accent-muted) !important;
    border: 1px solid rgba(59,130,246,0.2) !important;
    font-weight: 600;
    font-size: 0.78rem;
    color: var(--accent-hover) !important;
    letter-spacing: 0.01em;
  }

  /* === Section Labels === */
  .section-label {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
    padding-left: 2px;
  }

  /* === Alerts === */
  .alert {
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    border: 1px solid var(--border-default);
    padding: 12px 16px;
  }

  /* === Animations === */
  .animate-in {
    opacity: 0;
    transform: translateY(12px);
    animation: fadeSlideIn 0.45s ease forwards;
  }
  @keyframes fadeSlideIn {
    to { opacity: 1; transform: translateY(0); }
  }

  /* === Scrollbar === */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: var(--bg-root); }
  ::-webkit-scrollbar-thumb { background: var(--border-hover); border-radius: 99px; }

  /* Bootstrap overrides for this theme */
  .mb-3 { margin-bottom: 0 !important; }
  .mb-4 { margin-bottom: 0 !important; }
  .me-2 { margin-right: 0 !important; }

  /* Hide duplicate spacing from old classes */
  .mobile-row { gap: 16px; }
  .mobile-col { }
</style>
<div class="dashboard-container">

    <!-- Header -->
    <div class="dashboard-header animate-in" style="animation-delay:0s">
        <h1>Dashboard</h1>
        <p>Overview of your key management system</p>
    </div>

    <!-- Alerts -->
    <div class="row">
        <div class="col-lg-12">
            <?= $this->include('Layout/msgStatus') ?>
        </div>
        <?php if (session()->has('msgStatus')) : ?>
            <div id="status-message" class="alert alert-<?= session('msgStatus')['type'] ?> alert-dismissible fade show" role="alert" style="width:100%">
                <?= session('msgStatus')['message'] ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>
    </div>

    <!-- Top Row: Expiration + User Info -->
    <div class="row">
        <div class="col-lg-8 animate-in" style="animation-delay:0.05s">
            <div class="card">
                <div class="card-header">
                    <i class="bi bi-clock-history"></i> Expiration Countdown
                </div>
                <div class="card-body">
                    <p id="exp"></p>
                </div>
            </div>
        </div>

        <div class="col-lg-4 animate-in" style="animation-delay:0.1s">
            <div class="card">
                <div class="card-header">
                    <i class="bi bi-person-badge"></i> Account Info
                </div>
                <div class="card-body" style="padding:14px 16px;">
                    <ul class="list-group">
                        <li class="list-group-item">
                            <span><i class="bi bi-person-fill"></i> Role</span>
                            <span class="badge"><?= getLevel($user->level) ?></span>
                        </li>
                        <li class="list-group-item">
                            <span><i class="bi bi-wallet-fill"></i> Balance</span>
                            <span class="badge"><?= $user->saldo ?></span>
                        </li>
                        <li class="list-group-item">
                            <span><i class="bi bi-clock-fill"></i> Login Time</span>
                            <span class="badge"><?= $time::parse(session()->time_since)->humanize() ?></span>
                        </li>
                        <li class="list-group-item">
                            <span><i class="bi bi-box-arrow-right"></i> Auto Log-out</span>
                            <span class="badge"><?= $time::now()->difference($time::parse(session()->time_login))->humanize() ?></span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Stats: Keys -->
    <div class="row" style="margin-top:16px">
        <div class="col-lg-12">
            <div class="section-label animate-in" style="animation-delay:0.15s">Key Statistics</div>
        </div>
        <div class="col-md-3 animate-in" style="animation-delay:0.17s">
            <div class="card">
                <div class="card-body stat-card">
                    <div class="stat-icon blue"><i class="bi bi-key-fill"></i></div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $keycount['id_keys']; ?></div>
                        <div class="stat-label">Total Keys</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 animate-in" style="animation-delay:0.21s">
            <div class="card">
                <div class="card-body stat-card">
                    <div class="stat-icon green"><i class="bi bi-unlock-fill"></i></div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $active['devices']; ?></div>
                        <div class="stat-label">Used Keys</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 animate-in" style="animation-delay:0.25s">
            <div class="card">
                <div class="card-body stat-card">
                    <div class="stat-icon amber"><i class="bi bi-lock-fill"></i></div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $inactive['devices']; ?></div>
                        <div class="stat-label">Unused Keys</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="col-md-3 animate-in" style="animation-delay:0.29s">
            <div class="card">
                <div class="card-body stat-card">
                    <div class="stat-icon red"><i class="bi bi-slash-circle-fill"></i></div>
                    <div class="stat-content">
                        <div class="stat-value"><?php echo $blockCount; ?></div>
                        <div class="stat-label">Blocked Keys</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

</div>
        

<!-- Required JS Libraries -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>

<script>
    // Expiration Timer
    var countDownTimer = new Date("<?php echo "$getDateTime"; ?>").getTime();

    function padZero(num) {
        return num < 10 ? '0' + num : num;
    }

    var interval = setInterval(function() {
        var current = new Date().getTime();
        var diff = countDownTimer - current;

        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (diff < 0) {
            clearInterval(interval);
            document.getElementById("exp").innerHTML = '<span class="expired-label">Expired</span>';
        } else {
            document.getElementById("exp").innerHTML =
                '<div class="timer-grid">' +
                    '<div class="timer-segment"><div class="timer-value">' + padZero(days) + '</div><div class="timer-unit">Days</div></div>' +
                    '<div class="timer-separator">:</div>' +
                    '<div class="timer-segment"><div class="timer-value">' + padZero(hours) + '</div><div class="timer-unit">Hours</div></div>' +
                    '<div class="timer-separator">:</div>' +
                    '<div class="timer-segment"><div class="timer-value">' + padZero(minutes) + '</div><div class="timer-unit">Min</div></div>' +
                    '<div class="timer-separator">:</div>' +
                    '<div class="timer-segment"><div class="timer-value">' + padZero(seconds) + '</div><div class="timer-unit">Sec</div></div>' +
                '</div>';
        }
    }, 1000);

    // Animation for elements
    document.addEventListener('DOMContentLoaded', function() {
        const animatedElements = document.querySelectorAll('.animate-in');
        animatedElements.forEach(function(element) {
            element.style.animationPlayState = 'running';
        });
    });
</script>
<?= $this->endSection() ?>
