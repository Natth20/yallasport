# Normalises every off-palette colour literal in globals.css onto the single
# Yalla Sport palette. Semantics are preserved: live stays red, promotion stays
# green, the warm accent stays champagne/copper.
#
# Run:  pwsh -File scripts/unify-palette.ps1
#       pwsh -File scripts/unify-palette.ps1 -WhatIf   (report only)

param([switch]$WhatIf)

$path = Join-Path $PSScriptRoot '..\src\app\globals.css'
$css = [System.IO.File]::ReadAllText($path)
$before = $css

# ── hex literals ──────────────────────────────────────────────────────────────
$hexMap = [ordered]@{
  # gold family -> champagne #e8b48a
  '#e8b86d' = '#e8b48a'; '#c4a574' = '#e8b48a'; '#c9a227' = '#e8b48a'
  '#d4a050' = '#e8b48a'; '#d6c4a3' = '#e8b48a'; '#e8c07a' = '#e8b48a'
  '#c8a24a' = '#e8b48a'; '#b8963c' = '#c26a3a'

  # brown/copper family -> copper #c26a3a
  '#9a4e28' = '#c26a3a'; '#7c4a2a' = '#c26a3a'; '#8a5a28' = '#c26a3a'
  '#7a2e2a' = '#c26a3a'; '#5a3a18' = '#c26a3a'; '#4a2c1a' = '#1a2439'
  '#2a1810' = '#111a2b'; '#140c08' = '#070c16'

  # live / danger family -> red #ef4444
  '#e11d48' = '#ef4444'; '#f43f5e' = '#ef4444'; '#b9483e' = '#ef4444'
  '#fb7185' = '#f87171'; '#be123c' = '#b91c1c'

  # success family -> green #22c55e
  '#10b981' = '#22c55e'; '#34d399' = '#4ade80'; '#059669' = '#16a34a'

  # cream family -> #f4efe8
  '#f3e6c8' = '#f4efe8'; '#f4ead6' = '#f4efe8'; '#f4eee3' = '#f4efe8'
  '#ece6da' = '#f4efe8'; '#e4dccf' = '#f4efe8'; '#f6f1ea' = '#f4efe8'
  '#faf7f0' = '#f4efe8'; '#f4f1ec' = '#f4efe8'; '#f7f3ea' = '#f4efe8'
  '#fffcf8' = '#fffdf8'; '#f8f6f2' = '#f6f7f9'; '#f1efe9' = '#eef1f5'
  '#eceae4' = '#e6eaf0'; '#f7f5f1' = '#f6f7f9'; '#f0eeea' = '#eef1f5'
  '#ebe9e4' = '#e6eaf0'; '#e4ddd0' = '#e6eaf0'; '#cfc6b6' = '#cbd5e1'

  # dark surfaces -> navy family
  '#1c1917' = '#0f172a'; '#0b0d11' = '#0b1220'; '#07090d' = '#070c16'
  '#14110e' = '#0b1220'; '#1a1612' = '#0f1726'; '#1a120e' = '#0b1220'
  '#12151c' = '#0f1726'; '#07080b' = '#070c16'; '#050608' = '#05080f'
  '#151821' = '#111a2b'; '#0b0d12' = '#0b1220'; '#3f3a33' = '#475569'
  '#2c2925' = '#0f172a'; '#0a1a33' = '#0b1220'; '#282420' = '#111a2b'
  '#28241e' = '#111a2b'; '#322a20' = '#1a2439'; '#1a1614' = '#0f1726'
  '#090b10' = '#070c16'; '#080a0e' = '#05080f'; '#05070b' = '#05080f'
  '#0e1014' = '#0f1726'; '#1b2026' = '#1a2439'; '#16141a' = '#0f1726'
  '#100e0c' = '#0b1220'; '#0e0c0a' = '#070c16'; '#0d0b09' = '#070c16'
  '#121016' = '#0f1726'; '#181410' = '#111a2b'; '#231d18' = '#1a2439'

  # warm stone greys -> slate greys (the brand neutral ramp)
  '#78716c' = '#64748b'; '#57534e' = '#475569'; '#44403c' = '#334155'
  '#292524' = '#1e293b'; '#a8a29e' = '#94a3b8'; '#d6d3d1' = '#cbd5e1'
  '#e7e5e4' = '#e2e8f0'; '#f5f5f4' = '#f1f5f9'; '#fafaf9' = '#f8fafc'

  # remaining warm off-whites -> one cream / one near-white
  '#fff7ed' = '#f4efe8'; '#f7f0e2' = '#f4efe8'; '#f3ead8' = '#f4efe8'
  '#ece7dc' = '#f4efe8'; '#d6d0c4' = '#cbd5e1'; '#ffe4c4' = '#f4efe8'
  '#fffdf6' = '#fffdf8'; '#fffaf3' = '#fffdf8'; '#fbf8f1' = '#fffdf8'
  '#c9a46c' = '#e8b48a'; '#f4f3f1' = '#f1f5f9'
}

foreach ($k in $hexMap.Keys) {
  $css = [regex]::Replace($css, [regex]::Escape($k), $hexMap[$k], 'IgnoreCase')
}

# ── rgb()/rgba() numeric triples ──────────────────────────────────────────────
# Keys are "r,g,b" of the colour being retired; values are the canonical triple.
$rgbMap = [ordered]@{
  # gold -> champagne
  '232,184,109' = '232, 180, 138'; '196,165,116' = '232, 180, 138'
  '201,162,39'  = '232, 180, 138'; '212,160,80'  = '232, 180, 138'
  '214,196,163' = '232, 180, 138'; '245,158,11'  = '232, 180, 138'
  '120,90,40'   = '194, 106, 58';  '90,70,40'    = '194, 106, 58'

  # brown -> copper
  '154,90,50' = '194, 106, 58'; '124,74,42' = '194, 106, 58'
  '138,90,40' = '194, 106, 58'; '80,40,10'  = '194, 106, 58'
  '122,46,42' = '194, 106, 58'; '50,42,32'  = '15, 23, 42'
  '44,41,37'  = '15, 23, 42';   '40,36,30'  = '15, 23, 42'
  '28,25,23'  = '15, 23, 42';   '68,64,60'  = '71, 85, 105'
  '120,113,108' = '100, 116, 139'

  # live / danger -> red
  '225,29,72'  = '239, 68, 68'; '244,63,94' = '239, 68, 68'
  '185,72,62'  = '239, 68, 68'; '251,113,133' = '248, 113, 113'
  '190,18,60'  = '185, 28, 28'; '90,18,22'  = '127, 29, 29'

  # success -> green
  '16,185,129' = '34, 197, 94'; '52,211,153' = '34, 197, 94'
  '5,150,105'  = '22, 163, 74'

  # stray blues -> brand navy / sky
  '96,165,250' = '56, 189, 248'; '10,26,51' = '11, 18, 32'

  # cream -> single cream
  '243,230,200' = '244, 239, 232'; '250,248,244' = '244, 239, 232'
  '255,247,237' = '244, 239, 232'; '180,150,90'  = '232, 180, 138'

  # remaining near-blacks -> navy
  '11,13,17' = '11, 18, 32'; '7,9,13' = '7, 12, 22'; '5,6,8' = '5, 8, 15'

  # warm stone greys -> slate
  '87,83,78' = '71, 85, 105'; '168,162,158' = '148, 163, 184'
  '41,37,36' = '30, 41, 59'
}

foreach ($k in $rgbMap.Keys) {
  $p = $k -split ','
  # tolerate any whitespace between the components
  $pattern = "(?<=rgba?\(\s*)$($p[0])\s*,\s*$($p[1])\s*,\s*$($p[2])(?=\s*[,)])"
  $css = [regex]::Replace($css, $pattern, $rgbMap[$k])
}

if ($WhatIf) {
  Write-Output "would change: $(($before.Length - $css.Length)) char delta"
} else {
  [System.IO.File]::WriteAllText($path, $css, (New-Object System.Text.UTF8Encoding $false))
  Write-Output "globals.css normalised."
}

# ── report what is left ───────────────────────────────────────────────────────
$hex = [regex]::Matches($css, '#[0-9a-fA-F]{6}\b') | ForEach-Object { $_.Value.ToLower() }
$rgb = [regex]::Matches($css, 'rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+') | ForEach-Object { $_.Value -replace 'rgba?\(\s*','' -replace '\s','' }
Write-Output "unique hex: $(($hex | Select-Object -Unique).Count)   unique rgb: $(($rgb | Select-Object -Unique).Count)"
