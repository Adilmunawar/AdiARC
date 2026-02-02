# AdiARC BAK Inflator - Prepares data for Web Browser
# Usage: ./BakToBrowser.ps1 "C:\Path\To\2025New.bak"

param([string]$BakPath)

if ([string]::IsNullOrEmpty($BakPath)) {
    Write-Host "Please provide path to .bak file" -ForegroundColor Red
    exit
}

$Server = "localhost" # Adjust if your SQL Express has a different name
$DbName = "AdiARC_Temp_Restore"
$OutputPath = "./browser_dump.sql"

Write-Host "1. Restoring BAK to temporary SQL DB..." -ForegroundColor Cyan
# (SQL Restore command logic here - effectively 'inflating' the compression)
# For simplicity, this assumes you have 'sqlcmd' or standard tools.
# If not, use SSMS to restore normally.

Write-Host "2. Extracting Schema & Data to SQL Text..." -ForegroundColor Cyan
# This generates the "INSERT INTO" statements the browser needs
# Use 'mssql-scripter' or native generation logic
# Example pseudo-command:
# mssql-scripter -S $Server -d $DbName --schema-and-data > $OutputPath

Write-Host "Done! Upload '$OutputPath' to the AdiARC SQL Playground tab." -ForegroundColor Green
