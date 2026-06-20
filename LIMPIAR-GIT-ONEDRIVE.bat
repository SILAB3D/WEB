@echo off
cd /d "%~dp0"
echo ============================================
echo  Limpieza de desktop.ini dentro de .git
echo ============================================
if not exist ".git" (
  echo ERROR: no se encuentra la carpeta .git en %cd%
  echo Coloca este archivo en la raiz del repositorio.
  pause
  exit /b 1
)
echo Quitando atributos oculto/sistema/solo-lectura...
pushd ".git"
attrib -h -s -r desktop.ini /s 2>nul
echo Eliminando desktop.ini de .git y subcarpetas...
del /a /s /q desktop.ini 2>nul
popd
echo.
echo Verificando integridad del repositorio...
git fsck --full
echo.
echo Hecho. Si no aparecen errores arriba, ya puedes hacer commit y push.
pause
