@echo off
where mvn >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  mvn %*
  exit /b %ERRORLEVEL%
)
echo.
echo [backend] Maven no esta en el PATH.
echo [backend] Ejecuta el backend desde la IDE: Run TallerMecanicoApplication.java
echo [backend] El frontend seguira en http://127.0.0.1:5500
echo.
exit /b 1
