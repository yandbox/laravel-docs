@echo off

set name=laravel
set link=\d.com\sites\www\%name%
if exist %link% rmdir %link%
mklink /j %link% public

set name=assets-custom
set link=public\%name%
if exist %link% rmdir %link%
mklink /j %link% %name%
