$ErrorActionPreference = "Stop"

# BrightPath manifest generator
# Scans: public/assets/videos/grade-1, grade-2, grade-3
# Outputs: public/assets/manifests.js

$root = Split-Path -Parent $PSScriptRoot
$assets = Join-Path $root "public\assets"
$videosRoot = Join-Path $assets "videos"
$outFile = Join-Path $assets "manifests.js"

function Get-GradeFiles($gradeNumber) {
  $dir = Join-Path $videosRoot ("grade-" + $gradeNumber)
  if (-not (Test-Path $dir)) { return @() }

  $exts = @(".mp4", ".webm", ".mov", ".m4v")
  $files = Get-ChildItem -Path $dir -File | Where-Object {
    $exts -contains $_.Extension.ToLowerInvariant()
  } | Sort-Object Name

  return $files | ForEach-Object { $_.Name }
}

$g1 = Get-GradeFiles 1
$g2 = Get-GradeFiles 2
$g3 = Get-GradeFiles 3

function To-JsArray($items) {
  $escaped = $items | ForEach-Object {
    '"' + ($_ -replace '\\', '\\\\' -replace '"', '\"') + '"'
  }
  return "[ " + ($escaped -join ", ") + " ]"
}

$content = @"
// Auto-generated. Do not edit by hand.
// Generated at: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// Format: window.BRIGHTPATH_MANIFESTS = { 1: ["video.mp4", ...], 2: [...], 3: [...] }

window.BRIGHTPATH_MANIFESTS = {
  1: $(To-JsArray $g1),
  2: $(To-JsArray $g2),
  3: $(To-JsArray $g3)
};
"@

Set-Content -Path $outFile -Value $content -Encoding UTF8
Write-Host "Wrote manifests to: $outFile"
Write-Host ("Grade 1: " + $g1.Count + " videos")
Write-Host ("Grade 2: " + $g2.Count + " videos")
Write-Host ("Grade 3: " + $g3.Count + " videos")

