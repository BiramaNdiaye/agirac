<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class OTPOSECPECVG extends Model
{
    use HasFactory;
protected $table = 'otposecpecvg';
protected $fillable = [
    'address_site_a_name',
    'address_site_a_postal',
    'address_site_a_street',
    'address_site_a_town',
    'address_site_a_x',
    'address_site_a_y',
    'admin_bca',
    'admin_contract',
    'admin_prefix',
    'admin_rds',
    'bandwith',
    'bpe_piquage',
    'building_code',
    'client_directive_access',
    'client_directive_intervention',
    'client_directive_planning',
    'comment',
    'contact_on_site_firstname',
    'contact_on_site_lastname',
    'contact_on_site_mail',
    'contact_on_site_phone',
    'covage_contact_name',
    'fail_reason',
    'network',
    'nro_name',
    'nro_port',
    'offer',
    'oi_reference',
    'operator_client_ref',
    'operator_name',
    'order_date',
    'project_name',
    'rop_ref',
    'techno',
    'article_designation',
    'insee_code',
    'begin_client_wait',
    'client_wait_end',
    'mer_number',
    'equipement_number',
    'cancellation_date',
    'one_shot_info',
    'odf_pop',
    'odf_client',
    'address_site_b_name',
    'address_site_b_postal',
    'address_site_b_street',
    'address_site_b_town',
    'insee_code_site_b',
    'address_site_b_x',
    'address_site_b_y',
    'bpe_piquage_2',
    'contact_on_site_b_firstname',
    'contact_on_site_b_lastname',
    'contact_on_site_b_mail',
    'contact_on_site_b_phone',
    'number_fibers_fon',
];
    protected $guarded = [];

    protected $casts = [
        'order_date' => 'datetime',
        'begin_client_wait' => 'datetime',
        'client_wait_end' => 'datetime',
        'cancellation_date' => 'datetime',
 
    ];
}
