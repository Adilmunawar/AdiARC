# SQL Server Connection Tester
$Server = "192.125.6.11"
$Database = "master"
$User = "sa"
$Password = "justice@123"

Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "🔍 DIAGNOSTIC: Testing Connection to $Server..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------"

# 1. Test Network Port (TCP 1433)
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $connect = $tcp.BeginConnect($Server, 1433, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(3000, $false)
    if (!$wait) {
        Write-Host "❌ NETWORK ERROR: Port 1433 is blocked or unreachable." -ForegroundColor Red
        Write-Host "   Fix: Check VPN, Firewall, or Enable TCP/IP in SQL Config Manager."
        exit
    }
    $tcp.EndConnect($connect)
    $tcp.Close()
    Write-Host "✅ Network Reachable: Port 1433 is OPEN." -ForegroundColor Green
} catch {
    Write-Host "❌ NETWORK ERROR: $_" -ForegroundColor Red
    exit
}

# 2. Test Login (The 'Legacy' Way - No Encryption)
$ConnString = "Server=$Server;Database=$Database;User Id=$User;Password=$Password;TrustServerCertificate=True;Encrypt=False;Connection Timeout=5;"

Write-Host "Attempting Login (Legacy Mode)..." -NoNewline
try {
    $Conn = New-Object System.Data.SqlClient.SqlConnection
    $Conn.ConnectionString = $ConnString
    $Conn.Open()
    Write-Host " SUCCESS!" -ForegroundColor Green
    
    # Get Server Version
    $Cmd = $Conn.CreateCommand()
    $Cmd.CommandText = "SELECT @@VERSION"
    $Result = $Cmd.ExecuteScalar()
    Write-Host "📊 Server Version detected:" -ForegroundColor Yellow
    Write-Host $Result.ToString().Substring(0, 50) "..."
    
    $Conn.Close()
    Write-Host "`n✅ CONCLUSION: Your credentials and network are PERFECT." -ForegroundColor Green
    Write-Host "👉 The issue is purely inside the Next.js config."
}
catch {
    Write-Host " FAILED!" -ForegroundColor Red
    Write-Host "❌ Login Error: $($_.Exception.Message)" -ForegroundColor Red
}