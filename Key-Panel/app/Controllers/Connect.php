<?php

namespace App\Controllers;

use App\Models\KeysModel;

class Connect extends BaseController
{
    protected $model, $game, $uKey, $sDev, $maintenance, $staticWords;

    public function __construct()
    {
        $this->initializeDatabase();
        $this->model = new KeysModel();
        $this->checkMaintenanceStatus();
        $this->staticWords = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";
    }

    protected function initializeDatabase()
    {
        include('conn.php');
        $this->db = $conn; // Store the connection for reuse
    }

    protected function checkMaintenanceStatus()
    {
        $sql = "SELECT status FROM onoff WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        $status = mysqli_fetch_assoc($result);
        $this->maintenance = ($status['status'] == 'on');
    }

    public function index()
    {
        if ($this->request->getPost()) {
            return $this->index_post();
        }
        
        return $this->showErrorPage();
    }

    protected function showErrorPage()
    {
        $html = "<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <title>PowerHouse - Error 403 - Forbidden</title>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Creepster|Nosifer|Roboto');
    .maincontainer {
      position: relative;
      width: 100%;
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    .bat {
      position: absolute;
      animation: fly 15s linear infinite;
    }
    .foregroundimg {
      width: 100%;
      max-width: 800px;
    }
    .errorcode {
      font-family: 'Nosifer', cursive;
      color: #d10000;
      text-align: center;
      font-size: 5em;
      margin: 20px 0;
    }
    .errortext {
      font-family: 'Creepster', cursive;
      color: #d10000;
      text-align: center;
      font-size: 3em;
      margin: 20px 0;
    }
    @keyframes fly {
      0% { transform: translateX(-100px) rotate(0deg); opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { transform: translateX(1000px) rotate(360deg); opacity: 0; }
    }
  </style>
</head>
<body>
<div class='maincontainer'>
  <div class='bat'>
    <img class='wing leftwing' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-wing.png'>
    <img class='body' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-body.png' alt='bat'>
    <img class='wing rightwing' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-wing.png'>
  </div>
  <div class='bat'>
    <img class='wing leftwing' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-wing.png'>
    <img class='body' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-body.png' alt='bat'>
    <img class='wing rightwing' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-wing.png'>
  </div>
  <div class='bat'>
    <img class='wing leftwing' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-wing.png'>
    <img class='body' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-body.png' alt='bat'>
    <img class='wing rightwing' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/bat-wing.png'>
  </div>
  <img class='foregroundimg' src='https://aimieclouse.com/Media/Portfolio/Error403Forbidden/HauntedHouseForeground.png' alt='haunted house'>
</div>
<h1 class='errorcode'>ERROR 403</h1>
<div class='errortext'>
  <svg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 256 256'>
    <!-- SVG paths here -->
  </svg> Nikal Lode now!
</div>
</body>
</html>";

        return $html;
    }

    public function index_post()
    {
        if ($this->maintenance) {
            $sql = "SELECT myinput FROM onoff WHERE id=1";
            $result = mysqli_query($this->db, $sql);
            $maintenanceData = mysqli_fetch_assoc($result);
    
            return $this->response->setJSON([
                'status' => false,
                'reason' => $maintenanceData['myinput'] ?? 'Maintenance Mode'
            ]);
        }
        
        $game = trim($this->request->getPost('game'));
        $uKey = trim($this->request->getPost('user_key'));
        $sDev = trim($this->request->getPost('serial'));
    
        if (!$game || !$uKey || !$sDev) {
            return $this->response->setJSON([
                'status' => false,
                'reason' => 'INVALID PARAMETER'
            ]);
        }
    
        // ✅ USE ORIGINAL OBJECT-BASED MODEL METHOD
        $findKey = $this->model->getKeysGame([
            'user_key' => $uKey,
            'game'     => $game
        ]);
    
        if (!$findKey) {
            return $this->response->setJSON([
                'status' => false,
                'reason' => 'USER OR GAME NOT REGISTERED'
            ]);
        }
    
        if ($findKey->status != 1) {
            return $this->response->setJSON([
                'status' => false,
                'reason' => 'USER BLOCKED'
            ]);
        }
    
        $time     = new \CodeIgniter\I18n\Time;
        $id_keys  = $findKey->id_keys;
        $duration = (int)$findKey->duration;
        $expired  = $findKey->expired_date;
        $max_dev  = (int)$findKey->max_devices;
        $devices  = $findKey->devices;
    
        // ✅ Activate key first time
        if (!$expired) {
            $expired = $time::now()->addHours($duration)->format('Y-m-d H:i:s');
            $this->model->update($id_keys, ['expired_date' => $expired]);
        }
    
        // ✅ Expiry check
        if ($time::now()->isAfter($expired)) {
            return $this->response->setJSON([
                'status' => false,
                'reason' => 'EXPIRED KEY'
            ]);
        }
    
        // ✅ Device Handling
        $devicesArray = $devices ? explode(",", $devices) : [];
        $devicesArray = array_filter($devicesArray);
    
        if (!in_array($sDev, $devicesArray)) {
    
            if (count($devicesArray) >= $max_dev) {
                return $this->response->setJSON([
                    'status' => false,
                    'reason' => 'MAX DEVICE REACHED'
                ]);
            }
    
            $devicesArray[] = $sDev;
    
            $this->model->update($id_keys, [
                'devices' => implode(",", $devicesArray)
            ]);
        }
    
        // ✅ Load mod + features
        $featureData = $this->getFeatureData();
        $modData     = $this->getModData();
        $textData    = $this->getTextData();
    
        $real = "$game-$uKey-$sDev-$this->staticWords";
    
        return $this->response->setJSON([
            'status' => true,
            'data' => [
                'real' => $real,
                'token' => md5($real),
                'modname' => $modData['modname'] ?? '',
                'mod_status' => $textData['_status'] ?? '',
                'credit' => $textData['_ftext'] ?? '',
                'ESP' => $featureData['ESP'] ?? 'off',
                'Item' => $featureData['Item'] ?? 'off',
                'AIM' => $featureData['AIM'] ?? 'off',
                'SilentAim' => $featureData['SilentAim'] ?? 'off',
                'BulletTrack' => $featureData['BulletTrack'] ?? 'off',
                'Floating' => $featureData['Floating'] ?? 'off',
                'Memory' => $featureData['Memory'] ?? 'off',
                'Setting' => $featureData['Setting'] ?? 'off',
                'EXP' => $expired,
                'device'=> $max_dev,
                'rng' => $time->getTimestamp()
            ]
        ]);
    }

    protected function checkDevicesAdd($serial, $devices, $max_dev)
    {
        $lsDevice = explode(",", $devices);
        $cDevices = !empty($devices) ? count($lsDevice) : 0;
        $serialOn = in_array($serial, $lsDevice);

        if ($serialOn) {
            return true;
        }

        if ($cDevices < $max_dev) {
            $lsDevice[] = $serial;
            $setDevice = reduce_multiples(implode(",", $lsDevice), ",", true);
            return ['devices' => $setDevice];
        }

        return false;
    }

    protected function getFeatureData()
    {
        $sql = "SELECT * FROM Feature WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        return mysqli_fetch_assoc($result);
    }

    protected function getModData()
    {
        $sql = "SELECT modname FROM modname WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        return mysqli_fetch_assoc($result);
    }

    protected function getTextData()
    {
        $sql = "SELECT * FROM _ftext WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        return mysqli_fetch_assoc($result);
    }

    protected function getExpiryData($uKey)
    {
        $sql = "SELECT expired_date FROM keys_code WHERE user_key='$uKey'";
        $result = mysqli_query($this->db, $sql);
        return mysqli_fetch_assoc($result);
    }
}