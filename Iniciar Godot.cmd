@echo off
setlocal
set "RPG_GODOT=%USERPROFILE%\Desktop\Godot_v4.7.2-stable_win64.exe"
if not exist "%RPG_GODOT%" (
  echo Godot nao encontrado. Importe godot\project.godot no Godot 4 e pressione F6 ou F5.
  pause
  exit /b 1
)
start "" "%RPG_GODOT%" --path "%~dp0godot"
