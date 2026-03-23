<?php

namespace App\Controllers;

use App\Models\KeysModel;
use CodeIgniter\I18n\Time;

class apiserver extends BaseController
{
    protected $model, $game, $uKey, $sDev, $maintenance, $staticWords, $db;

    public function __construct()
    {
        $this->initializeDatabase();
        $this->model = new KeysModel();
        $this->checkMaintenanceStatus();
        $this->staticWords = "Vm8Lk7Uj2JmsjCPVPVjrLa7zgfx3uz9E";
    }

    /**
     * Include your mysqli connection and keep it for reuse.
     */
    protected function initializeDatabase()
    {
        include('conn.php');
        $this->db = $conn;
    }

    /**
     * Cache maintenance flag.
     */
    protected function checkMaintenanceStatus()
    {
        $sql    = "SELECT status FROM onoff WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        $row    = $result ? mysqli_fetch_assoc($result) : null;

        $this->maintenance = ($row && $row['status'] === 'on');
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
  <title>TOPTEN - Error 403 - Forbidden</title>
  <style>
    @import url('https://fonts.googleapis.com/css?family=Creepster|Nosifer|Roboto');
    .maincontainer { position: relative; width: 100%; max-width: 800px; margin: 0 auto; text-align: center; }
    .bat { position: absolute; animation: fly 15s linear infinite; }
    .foregroundimg { width: 100%; max-width: 800px; }
    .errorcode { font-family: 'Nosifer', cursive; color: #d10000; text-align: center; font-size: 5em; margin: 20px 0; }
    .errortext { font-family: 'Creepster', cursive; color: #d10000; text-align: center; font-size: 3em; margin: 20px 0; }
    @keyframes fly { 0% { transform: translateX(-100px) rotate(0deg); opacity: 0; }
      10% { opacity: 1; } 90% { opacity: 1; }
      100% { transform: translateX(1000px) rotate(360deg); opacity: 0; } }
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
<div class='errortext'>Nikal Lode now!</div>
</body>
</html>";
        return $html;
    }

    /**
     * Convert any Time/DateTime value to a plain string for JSON.
     */
    protected function normalizeTime($t): string
    {
        if ($t instanceof Time || $t instanceof \DateTimeInterface) {
            return $t->format('Y-m-d H:i:s');
        }
        return (string)$t;
    }

   
    protected function sendEngineJson(array $payload, int $statusCode = 200)
    {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            $json       = '{"ok":false,"reason":"json_encode_failed"}';
            $statusCode = 500;
        }
        $body = $this->__EnginePack($json);

 

        return $this->response
            ->setStatusCode($statusCode)
            ->setContentType('text/plain')
            ->setBody($body);
    }

    private function __EnginePack(string $plain): string
    {
        $K = [0x7B,0x21,0xC5,0xE2,0x9A,0x3F,0x44,0x10,0xD8,0x6C,0xB2,0x0E,0x55,0xA9,0x71,0x3D];
        $l = strlen($plain); $buf = '';
        for ($i = 0; $i < $l; $i++) {
            $buf .= chr(ord($plain[$i]) ^ $K[$i & 15]);
        }
        $e = implode('', array_map('chr', [98,97,115,101,54,52,95,101,110,99,111,100,101])); 
        $s = $e($buf);
        $s = strtr(rtrim($s, '='), '+/', '-_');
        return $s;
    }


    public function index_post()
    {
        $isMT = $this->maintenance;
        $game = $this->request->getPost('game');
        $uKey = $this->request->getPost('user_key');
        $sDev = $this->request->getPost('serial');

        $form_rules = [
            'game'     => 'required|alpha_dash',
            'user_key' => 'required|min_length[1]|max_length[36]',
            'serial'   => 'required|alpha_dash'
        ];

        if (!$this->validate($form_rules)) {
            return $this->sendEngineJson([
                'status' => false,
                'reason' => 'Bad Parameter'
            ], 400);
        }

        if ($isMT) {
            $sql    = "SELECT myinput FROM onoff WHERE id=1";
            $result = mysqli_query($this->db, $sql);
            $row    = $result ? mysqli_fetch_assoc($result) : ['myinput' => 'MAINTENANCE'];
            return $this->sendEngineJson([
                'status' => true,
                'reason' => $row['myinput']
            ]);
        }

        if (!$game || !$uKey || !$sDev) {
            return $this->sendEngineJson([
                'status' => false,
                'reason' => 'INVALID PARAMETER'
            ], 400);
        }

        $findKey = $this->model->getKeysGame(['user_key' => $uKey, 'game' => $game]);
        if (!$findKey) {
            return $this->sendEngineJson([
                'status' => false,
                'reason' => 'USER OR GAME NOT REGISTERED'
            ], 404);
        }

        if ((int)$findKey->status !== 1) {
            return $this->sendEngineJson([
                'status' => false,
                'reason' => 'USER BLOCKED'
            ], 403);
        }

        $id_keys  = $findKey->id_keys;
        $duration = (int)$findKey->duration;
        $expired  = $findKey->expired_date;        // may be null or 'Y-m-d H:i:s' string
        $max_dev  = (int)$findKey->max_devices;
        $devices  = (string)$findKey->devices;

        // Calculate/validate expiry
        if (!$expired) {
            $setExpired = Time::now()->addHours($duration);
            $this->model->update($id_keys, ['expired_date' => $setExpired->format('Y-m-d H:i:s')]);
            $expiredObj = $setExpired;
        } else {
            $expiredObj = Time::parse($expired);
            if (!Time::now()->isBefore($expiredObj)) {
                return $this->sendEngineJson([
                    'status' => false,
                    'reason' => 'EXPIRED KEY'
                ], 403);
            }
        }

        // Enforce device binding
        $devicesAdd = $this->checkDevicesAdd($sDev, $devices, $max_dev);
        if ($devicesAdd === false) {
            return $this->sendEngineJson([
                'status' => false,
                'reason' => 'MAX DEVICE REACHED'
            ], 403);
        }
        if (is_array($devicesAdd)) {
            $this->model->update($id_keys, $devicesAdd);
        }

        // Load feature/text/mod info
        $featureData = $this->getFeatureData();
        $modData     = $this->getModData();
        $textData    = $this->getTextData();
        $expiryData  = $this->getExpiryData($uKey);

        $real   = "$game-$uKey-$sDev-$this->staticWords";
        $expStr = $this->normalizeTime($expiredObj);

        $expired_date_out = isset($expiryData['expired_date']) && $expiryData['expired_date']
            ? (string)$expiryData['expired_date']
            : $expStr;

        $payload = [
            'status' => true,
            'data'   => [
                'real'        => $real,
                'token'       => md5($real),
                'modname'     => $modData['modname'] ?? '',
                'mod_status'  => $textData['_status'] ?? '',
                'credit'      => $textData['_ftext'] ?? '',
                'ESP'         => $featureData['ESP'] ?? '',
                'Item'        => $featureData['Item'] ?? '',
                'AIM'         => $featureData['AIM'] ?? '',
                'SilentAim'   => $featureData['SilentAim'] ?? '',
                'BulletTrack' => $featureData['BulletTrack'] ?? '',
                'Floating'    => $featureData['Floating'] ?? '',
                'Memory'      => $featureData['Memory'] ?? '',
                'Setting'     => $featureData['Setting'] ?? '',
                'expired_date'=> $expired_date_out,
                'EXP'         => $expStr,
                'Enc'         => 'List Of Games',
                'exdate'      => $expStr,
                'device'      => $max_dev,
                'rng'         => time(),
            ],
        ];

        return $this->sendEngineJson($payload);
    }

    /**
     * Device binder: returns true (already bound), array to update devices, or false (limit reached).
     */
    protected function checkDevicesAdd($serial, $devices, $max_dev)
    {
        $serial = (string)$serial;

        $lsDevice = [];
        if (!empty($devices)) {
            $lsDevice = array_filter(array_map('trim', explode(',', (string)$devices)));
        }

        if (in_array($serial, $lsDevice, true)) {
            return true;
        }

        if (count($lsDevice) < (int)$max_dev) {
            $lsDevice[] = $serial;
            if (function_exists('reduce_multiples')) {
                $setDevice = reduce_multiples(implode(',', $lsDevice), ',', true);
            } else {
                $setDevice = implode(',', $lsDevice);
            }
            return ['devices' => $setDevice];
        }

        return false;
    }

    protected function getFeatureData()
    {
        $sql    = "SELECT * FROM Feature WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        return $result ? mysqli_fetch_assoc($result) : [];
    }

    protected function getModData()
    {
        $sql    = "SELECT modname FROM modname WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        return $result ? mysqli_fetch_assoc($result) : [];
    }

    protected function getTextData()
    {
        $sql    = "SELECT * FROM _ftext WHERE id=1";
        $result = mysqli_query($this->db, $sql);
        return $result ? mysqli_fetch_assoc($result) : [];
    }

    protected function getExpiryData($uKey)
    {
        $uKey   = mysqli_real_escape_string($this->db, $uKey);
        $sql    = "SELECT expired_date FROM keys_code WHERE user_key='$uKey' LIMIT 1";
        $result = mysqli_query($this->db, $sql);
        return $result ? mysqli_fetch_assoc($result) : ['expired_date' => null];
    }
}