<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();

        // Guard: RefreshDatabase wipes the DB, so refuse anything but the test database
        // (e.g. a stale `php artisan config:cache` pointing at aptrg_lms).
        $database = $app['config']->get('database.connections.'.$app['config']->get('database.default').'.database');
        if ($database !== 'aptrg_lms_test') {
            throw new RuntimeException("Tests must run against aptrg_lms_test, got [{$database}].");
        }

        return $app;
    }
}
