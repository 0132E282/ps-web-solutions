<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Theme\ThemeTagController;
use App\Http\Controllers\Theme\ThemeCategoryController;

Route::admin()->group(function () {
  Route::module('themes', ThemeController::class);
  Route::module('theme-tags', ThemeTagController::class);
  Route::module('theme-categories', ThemeCategoryController::class);
});
