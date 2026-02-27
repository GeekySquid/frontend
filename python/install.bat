@echo off
echo Installing Python dependencies for Portfolio Analyzer...
echo.

python --version
if errorlevel 1 (
    echo Python is not installed or not in PATH
    echo Please install Python 3.8+ from python.org
    pause
    exit /b 1
)

echo.
echo Installing required packages...
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo Installation failed. Trying with --user flag...
    pip install --user -r requirements.txt
)

echo.
echo Installation complete!
echo You can now use the Portfolio Analyzer feature.
pause
