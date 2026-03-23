<?php

namespace App\Models;

use CodeIgniter\Model;
use \Hermawan\DataTables\DataTable;

class KeysModel extends Model
{
    protected $table      = 'keys_code';
    protected $primaryKey = 'id_keys';
    protected $returnType = 'array';

    // ✅ IMPORTANT: Added missing fields for reset system
    protected $allowedFields = [
        'game',
        'user_key',
        'duration',
        'expired_date',
        'max_devices',
        'devices',
        'status',
        'registrator',
        'created_at',
        'updated_at',
        'key_reset_time',
        'key_reset_token'
    ];

    // ✅ Auto handle created_at & updated_at
    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    /*
    |--------------------------------------------------------------------------
    | Get single key by value
    |--------------------------------------------------------------------------
    */
    public function getKeys($key = false, $where = 'user_key')
    {
        return $this->where($where, $key)
            ->get()
            ->getRowObject();
    }

    /*
    |--------------------------------------------------------------------------
    | Get key by multiple conditions
    |--------------------------------------------------------------------------
    */
    public function getKeysGame($where)
    {
        return $this->where($where)
            ->get()
            ->getRowObject();
    }

    /*
    |--------------------------------------------------------------------------
    | Datatable API
    |--------------------------------------------------------------------------
    */
    public function API_getKeys()
    {
        $connect = db_connect();
        $builder = $connect->table($this->table);

        $userModel = new UserModel();
        $user = $userModel->getUser();

        if ($user->level != 1) {
            $builder->where('registrator', $user->username);
        }

        $builder->select('
            keys_code.id_keys as id,
            game,
            user_key,
            duration,
            expired_date as expired,
            max_devices,
            devices,
            status,
            registrator,
            key_reset_time
        ');

        return DataTable::of($builder)

            ->setSearchableColumns([
                'id_keys',
                'game',
                'user_key',
                'duration',
                'expired_date',
                'max_devices',
                'devices',
                'registrator'
            ])

            ->format('status', function ($value) {
                return ($value ? "Active" : "Inactive");
            })

            ->format('duration', function ($value) {
                if ($value == 1) {
                    return "1 Hour";
                } elseif ($value >= 2 && $value < 24) {
                    return "$value Hours";
                } elseif ($value == 24) {
                    return "1 Day";
                } else {
                    return ($value / 24) . " Days";
                }
            })

            ->format('devices', function ($value) {
                if ($value) {
                    $e = explode(',', reduce_multiples($value, ",", true));
                    return count($e);
                }
                return 0;
            })

            ->format('expired', function ($value) {
                $time = new \CodeIgniter\I18n\Time;
                return $value
                    ? $time::parse($value)->toLocalizedString('d MMM yy - H:mm')
                    : '';
            })

            ->toJson(true);
    }
}