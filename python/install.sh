#!/bin/bash

echo "Installing Python dependencies for Portfolio Analyzer..."
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed"
    echo "Please install Python 3.8+ first"
    exit 1
fi

python3 --version
echo ""

# Install packages
echo "Installing required packages..."
pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo ""
    echo "Installation complete!"
    echo "You can now use the Portfolio Analyzer feature."
else
    echo ""
    echo "Installation failed. Trying with --user flag..."
    pip3 install --user -r requirements.txt
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "Installation complete!"
        echo "You can now use the Portfolio Analyzer feature."
    else
        echo ""
        echo "Installation failed. Please check your Python and pip installation."
        exit 1
    fi
fi
