const WAIT_TIMEOUT_SEC = 120

export function buildWindowsUpdateScript(isMsi: boolean): string {
  const installBlock = isMsi
    ? '$p = Start-Process -FilePath "msiexec.exe" -ArgumentList @("/i", $InstallerPath, "/qn", "/norestart") -Wait -PassThru'
    : '$p = Start-Process -FilePath $InstallerPath -ArgumentList @("/S") -Wait -PassThru'

  return `
param(
  [Parameter(Mandatory = $true)][int]$TargetPid,
  [Parameter(Mandatory = $true)][string]$InstallerPath,
  [Parameter(Mandatory = $true)][string]$RelaunchExe
)
$ErrorActionPreference = "Stop"
$deadline = (Get-Date).AddSeconds(${WAIT_TIMEOUT_SEC})
while ((Get-Process -Id $TargetPid -ErrorAction SilentlyContinue) -and ((Get-Date) -lt $deadline)) {
  Start-Sleep -Milliseconds 500
}
${installBlock}
if ($p.ExitCode -ne 0) { exit $p.ExitCode }
Start-Process -FilePath $RelaunchExe
`
}

export function buildPosixWaitForPidBlock(pid: number): string {
  return `
wait_for_pid() {
  local pid=$1
  local max=${WAIT_TIMEOUT_SEC}
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -ge "$max" ]; then
      exit 1
    fi
    sleep 0.5
  done
}
wait_for_pid ${pid}
`
}

export function buildMacUpdateScriptBody(
  pid: number,
  sourceApp: string,
  targetApp: string
): string {
  return `${buildPosixWaitForPidBlock(pid)}
ditto "${sourceApp}" "${targetApp}"
open "${targetApp}"
`
}

export function buildLinuxAppImageUpdateScriptBody(
  pid: number,
  installerPath: string,
  appImagePath: string
): string {
  return `${buildPosixWaitForPidBlock(pid)}
chmod +x "${installerPath}"
cp "${installerPath}" "${appImagePath}.new"
chmod +x "${appImagePath}.new"
if [ -f "${appImagePath}" ]; then
  mv "${appImagePath}" "${appImagePath}.backup"
fi
mv "${appImagePath}.new" "${appImagePath}"
rm -f "${appImagePath}.backup"
rm -f "${installerPath}"
exec "${appImagePath}"
`
}

export function buildLinuxDebUpdateScriptBody(
  pid: number,
  installerPath: string,
  relaunchExe: string
): string {
  return `${buildPosixWaitForPidBlock(pid)}
if command -v pkexec >/dev/null 2>&1; then
  pkexec env DISPLAY="\${DISPLAY:-:0}" DEBIAN_FRONTEND=noninteractive dpkg -i "${installerPath}"
elif command -v sudo >/dev/null 2>&1; then
  sudo env DEBIAN_FRONTEND=noninteractive dpkg -i "${installerPath}"
else
  xdg-open "${installerPath}"
  exit 0
fi
if [ -x "${relaunchExe}" ]; then
  nohup "${relaunchExe}" >/dev/null 2>&1 &
fi
`
}
