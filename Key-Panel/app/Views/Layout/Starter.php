<!doctype html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    
    <!-- Browser Logo -->
    <link rel="shortcut icon"
        href="<?= site_url('getkey/img/logo.jpg') ?>"
        type="image/x-icon">

    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">

    <title><?= BASE_NAME ?> - <?= isset($title) ? $title : 'Panel' ?></title>
    <?= $this->renderSection('css') ?>

    <?= link_tag('assets/css/natacode.css') ?>

    <script src="https://code.jquery.com/jquery-3.6.0.js" integrity="sha256-H+K7U5CnXl1h5ywQfKtSj8PCmoN9aaq30gDh27Xc0jk=" crossorigin="anonymous"></script>
</head>
<style> 
    body {
        font-family: 'Poppins', sans-serif !important;
        background-size: auto;
        transition: background-image 0.5s ease;
    }
    
    body.light-mode {
        background: #0f172a;  /* example dark navy */
    }
    
    body.dark-mode {
        background: #0b1020;  /* deeper cyber blue */
    }
    
    .theme-switch-wrapper {
        position: fixed;
        right: 20px;
        bottom: 70px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
    }
    
    .theme-switch {
        display: inline-block;
        height: 34px;
        position: relative;
        width: 60px;
    }
    
    .theme-switch input {
        display: none;
    } 
     
     footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(135deg, var(--neon-blue), var(--cyber-purple)); /* ✅ same as header */
  backdrop-filter: blur(8px);
  padding: 6px 0;
  border-radius: 12px 12px 0 0;
  box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
}

footer small {
  color: #ffffff;
  font-size: 13px;
  font-weight: 600;
}
    
    .slider {
        background-color: #ccc;
        bottom: 0;
        cursor: pointer;
        left: 0;
        position: absolute;
        right: 0;
        top: 0;
        transition: .4s;
        border-radius: 34px;
    }
    
    .slider:before {
        background-color: #fff;
        bottom: 4px;
        content: "";
        height: 26px;
        left: 4px;
        position: absolute;
        transition: .4s;
        width: 26px;
        border-radius: 50%;
    }
    
    input:checked + .slider {
        background-color: #2196F3;
    }
    
    input:checked + .slider:before {
        transform: translateX(26px);
    } 
    
    table, 
    table.table,
    .table,
    table th,
    table td,
    .table th,
    .table td,
    table thead th,
    .table thead th,
    table tbody td,
    .table tbody td,
    table tfoot td,
    .table tfoot td {
        background-color: transparent !important;
        border-color: rgba(255, 255, 255, 0.2) !important;
    }
    
    /* For striped tables */
    .table-striped tbody tr:nth-of-type(odd) {
        background-color: rgba(255, 255, 255, 0.05) !important;
    }
    
    /* For hover effects */
    .table-hover tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.1) !important;
    }
</style>
<body class="dark-mode">
    <!-- Start menu -->
    <?= $this->include('Layout/Header') ?>
    <!-- End of menu -->
    <main>
        <div class="container p-3 py-4 mb-3" id="content">
            <!-- Start content -->
            <?= $this->renderSection('content') ?>
            <!-- End of content -->
        </div>
    </main>
    
    <!-- ✅ Footer -->
  <footer class="text-white text-center">
    <div class="container">
      <small>&copy; <?= date('D') ?> <?= date('j') ?>-<?= date('M') ?> <?= date('Y') ?> - <?= BASE_NAME ?></small>
    </div>
  </footer>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11.10.2"></script>
    
    <?= script_tag('assets/js/natacode.js') ?>
    <?= $this->renderSection('js') ?>
    
    <script>
        // Theme switcher functionality
        const toggleSwitch = document.querySelector('.theme-switch input[type="checkbox"]');
        const currentTheme = localStorage.getItem('theme');
        const themeLabels = document.querySelectorAll('.theme-label');
        
        // Apply saved theme or default to dark
        if (currentTheme) {
            document.body.className = currentTheme;
            if (currentTheme === 'light-mode') {
                toggleSwitch.checked = true;
                updateLabels('light');
            } else {
                updateLabels('dark');
            }
        } else {
            // Default to dark mode if no preference saved
            document.body.classList.add('dark-mode');
            updateLabels('dark');
        }
        
        function switchTheme(e) {
            if (e.target.checked) {
                document.body.classList.replace('dark-mode', 'light-mode');
                localStorage.setItem('theme', 'light-mode');
                updateLabels('light');
            } else {
                document.body.classList.replace('light-mode', 'dark-mode');
                localStorage.setItem('theme', 'dark-mode');
                updateLabels('dark');
            }
        }
        
        function updateLabels(mode) {
            if (mode === 'light') {
                themeLabels[0].style.display = 'none';
                themeLabels[1].style.display = 'inline';
            } else {
                themeLabels[0].style.display = 'inline';
                themeLabels[1].style.display = 'none';
            }
        }
        
        toggleSwitch.addEventListener('change', switchTheme, false);
    </script>
</body>
</html>