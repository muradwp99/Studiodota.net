# Starts the project-local MySQL 8.4 instance (port 3307) if it isn't running.
# Data lives in <repo>/.mysql/data; server binaries come from the system MySQL 8.4 install.
$ErrorActionPreference = "Stop"
$dataDir = Join-Path (Split-Path (Split-Path $PSScriptRoot -Parent) -Parent) ".mysql\data"
$mysqld = "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe"

$t = New-Object Net.Sockets.TcpClient
try {
  $t.Connect("127.0.0.1", 3307)
  Write-Host "MySQL already running on 127.0.0.1:3307"
  exit 0
} catch {} finally { $t.Close() }

if (-not (Test-Path $mysqld)) { Write-Error "mysqld not found at $mysqld"; exit 1 }
if (-not (Test-Path $dataDir)) { Write-Error "Data dir missing: $dataDir  (see handoff.md to re-initialize)"; exit 1 }

Write-Host "Starting project MySQL on 127.0.0.1:3307 ..."
Start-Process -FilePath $mysqld -ArgumentList @(
  "--no-defaults",
  "--datadir=$dataDir",
  "--port=3307",
  "--bind-address=127.0.0.1",
  "--innodb-buffer-pool-size=128M",
  "--mysqlx=OFF"
) -WindowStyle Hidden
Start-Sleep -Seconds 3
Write-Host "MySQL started (background process)."
