<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Theme\ThemeController;
use App\Http\Controllers\Theme\ThemeOptionController;
use App\Http\Controllers\Theme\ThemeCategoryController;
use App\Http\Controllers\Content\PostController;
use App\Http\Controllers\Content\PostCategoryController;
use App\Http\Controllers\Content\ProjectController;
use App\Http\Controllers\Content\ProjectCategoryController;

Route::admin()->group(function () {
  Route::module('themes', ThemeController::class);
  Route::module('theme-options', ThemeOptionController::class);
  Route::module('theme-categories', ThemeCategoryController::class);

  Route::module('posts', PostController::class);
  Route::module('post-categories', PostCategoryController::class);
  Route::module('projects', ProjectController::class);
  Route::module('project-categories', ProjectCategoryController::class);
});
