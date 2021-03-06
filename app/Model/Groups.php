<?php

namespace App\Model;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
class Groups extends Model
{
    //
    use SoftDeletes;
    /**
     * 应该被调整为日期的属性
     *
     * @var array
     */
    protected $dates = ['deleted_at'];
    /**
     * 可以被批量赋值的属性.
     *
     * @var array
     */
    protected $fillable = ['name','owner_name','u_id','type'];

    public function folders()
    {
        return $this->hasMany('App\Model\Folder','g_id','id');
    }

    /**
     *  是否公开
     * @param $query
     * @param int $type 默认是公开
     * @return mixed
     */
    public function scopeIsPrivate($query, $type = 1)
    {
        return $query->orWhere('type', $type);
    }
}
