<?php $UL = (int) session('user_level'); ?>

<header>
  <nav class="navbar navbar-dark fixed-top glass-nav shadow-lg">
    <div class="container-fluid d-flex justify-content-between align-items-center">

      <!-- Brand -->
      <a class="navbar-brand brand-glass" href="<?= site_url() ?>">
        <svg class="user-shield-icon" viewBox="1 1 22 22" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 1L3 5V11C3 16.55 7.04 21.74 12 23C16.96 21.74 21 16.55 21 11V5L12 1ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 20C9.33 20 6.41 18.36 6.05 15C6.17 13 10 11.9 12 11.9C14 11.9 17.83 13 17.95 15C17.59 18.36 14.67 20 12 20Z"/>
        </svg>
        <?= BASE_NAME ?>
      </a>

      <?php if (!session()->has('userid')) $UL = 0; ?>

      <!-- Menu Button -->
      <button
        class="menu-btn <?= $UL > 0 ? '' : 'disabled' ?>"
        <?= $UL > 0 ? 'onclick="toggleMenu(this)"' : '' ?>
        <?= $UL > 0 ? '' : 'disabled' ?>
        aria-label="Open menu"
        aria-controls="slideMenu"
        aria-expanded="false"
      >
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

    </div>
  </nav>
</header>

<div style="height: var(--nav-h);"></div>

<div id="menuOverlay" class="menu-overlay" onclick="closeMenu()"></div>

<!-- Slide Menu -->
<aside id="slideMenu" class="slide-menu">

  <nav class="menu-links">
    <a href="<?= site_url('keys') ?>"><i class="bi bi-key-fill pe-2"></i>Keys</a>
    <a href="<?= site_url('keys/generate') ?>"><i class="bi bi-plus-circle-fill pe-2"></i>Genarate Key</a>
    <a href="<?= site_url('settings') ?>"><i class="bi bi-gear-fill pe-2"></i>Settings</a>
    <a href="<?= site_url('twofa') ?>"><i class="fas fa-shield-alt pe-2"></i>2AF Authentication</a>

    <?php if ($UL === 1): ?>
      <div class="menu-divider"></div>
      <a href="<?= site_url('Server') ?>"><i class="bi bi-controller pe-2"></i>Online System</a>
      <a href="<?= site_url('lib') ?>"><i class="bi bi-person-plus-fill pe-2"></i>Online LIB</a>
      <a href="<?= site_url('ExtendDuration') ?>"><i class="bi bi-clock-history pe-2"></i>Extend Key</a>
      <a href="<?= site_url('balance') ?>"><i class="bi bi-cash-coin pe-2"></i>Add Balance</a>
      <a href="<?= site_url('price') ?>"><i class="bi bi-currency-exchange pe-2"></i>Add Duration</a>
      <a href="<?= site_url('settingsx') ?>"><i class="bi bi-pencil-fill pe-2"></i>Change Name</a>
      <a href="<?= site_url('license') ?>"><i class="bi bi-key-fill pe-2"></i>Change Licence</a>
      <a href="<?= site_url('account_approve') ?>"><i class="bi bi-person-check-fill pe-2"></i>Account Approvals</a>
      <a href="<?= site_url('admin/manage-users') ?>"><i class="bi bi-people-fill pe-2"></i>Manage Users</a>
      <a href="<?= site_url('admin/create-referral') ?>"><i class="bi bi-person-plus-fill pe-2"></i>Create Referral</a>

    <?php elseif ($UL === 2): ?>
      <div class="menu-divider"></div>
      <a href="<?= site_url('account_approve') ?>"><i class="bi bi-person-check-fill pe-2"></i>Account Approvals</a>
      <a href="<?= site_url('admin/manage-users') ?>"><i class="bi bi-people-fill pe-2"></i>Manage Users</a>
      <a href="<?= site_url('admin/create-referral') ?>"><i class="bi bi-person-plus-fill pe-2"></i>Create Referral</a>
    <?php endif; ?>

    <div class="menu-divider"></div>
    <a href="<?= site_url('logout') ?>" class="logout-link">
      <i class="bi bi-box-arrow-left pe-2"></i>Logout
    </a>
  </nav>

</aside>

<style>
:root{
  --glass-border: rgba(255,255,255,.28);
  --nav-h:60px;
}

/* NAV */
.glass-nav{
  z-index:3000;
  background:linear-gradient(135deg,var(--neon-blue),var(--cyber-purple));
  border-bottom:1px solid var(--glass-border);
  backdrop-filter:blur(12px);
}

.brand-glass{
  color:var(--neon-blue)!important;
  display:flex;
  align-items:center;
  gap:8px;
}

.user-shield-icon{
  width:20px;
  fill:currentColor;
}

/* BUTTON */
.menu-btn{
  width:32px;height:24px;
  display:flex;flex-direction:column;justify-content:space-between;
  border:none;background:transparent;cursor:pointer;
}
.menu-btn .bar{
  height:3px;width:100%;
  background:rgba(0,242,255,.7);
  border-radius:4px;
  transition:.35s;
}
.menu-btn.active .bar:nth-child(1){transform:rotate(45deg) translate(5px,5px);}
.menu-btn.active .bar:nth-child(2){opacity:0;}
.menu-btn.active .bar:nth-child(3){transform:rotate(-45deg) translate(6px,-6px);}
.menu-btn.disabled{opacity:.4;pointer-events:none;}

/* OVERLAY */
.menu-overlay{
  position:fixed;top:var(--nav-h);left:0;
  width:100%;height:calc(100% - var(--nav-h));
  background:rgba(0,0,0,.5);
  display:none;z-index:2000;
}
.menu-overlay.show{display:block;}

/* SLIDE MENU – NO FLASH VERSION */
.slide-menu{
  position:fixed;
  top:var(--nav-h);
  right:-260px;               /* hidden off screen */
  width:240px;
  height:calc(100% - var(--nav-h));
  background:var(--panel-bg);
  backdrop-filter:blur(14px);
  border-left:1px solid var(--glass-border);
  box-shadow:-8px 0 24px rgba(0,0,0,.5);
  transition:right .35s ease; /* animate position */
  z-index:2500;
  display:flex;
  flex-direction:column;
}
.slide-menu.open{ right:0; }

.menu-links{padding:6px 0;flex:1;overflow-y:auto;}
.menu-links a{
  display:block;
  padding:12px 18px;
  color:#e0f7fa;
  text-decoration:none;
  transition:.3s;
}
.menu-links a:hover{
  background:rgba(0,242,255,.12);
}

.menu-divider{
  height:1px;
  background:rgba(255,255,255,.15);
  margin:10px 16px;
}

.logout-link{color:red!important;}
</style>

<script>
(function(){
  const menu=document.getElementById('slideMenu');
  const overlay=document.getElementById('menuOverlay');
  const btn=document.querySelector('.menu-btn');

  window.toggleMenu=function(button){
    menu.classList.toggle('open');
    overlay.classList.toggle('show');
    button.classList.toggle('active');
  }

  window.closeMenu=function(){
    menu.classList.remove('open');
    overlay.classList.remove('show');
    btn?.classList.remove('active');
  }

  document.addEventListener('keydown',e=>{
    if(e.key==='Escape') closeMenu();
  });
})();
</script>