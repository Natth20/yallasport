# Second stage of the palette unification: snaps the hue of every remaining
# long-tail colour onto one of the four Yalla Sport hue families, while leaving
# saturation and lightness untouched so gradients keep their depth.
#
#   warm  (orange / copper / champagne / cream)  ->  24deg
#   cool  (navy / slate surfaces and neutrals)   -> 217deg
#   green (pitch, promotion, success)            -> 142deg
#   red   (live, danger, relegation)             ->   0deg
#
# Run:  pwsh -File scripts/unify-hues.ps1 [-WhatIf]

param([switch]$WhatIf)

$path = Join-Path $PSScriptRoot '..\src\app\globals.css'
$css = [System.IO.File]::ReadAllText($path)

# Colours that already define the palette — never touch these.
$canon = @(
  '#c26a3a','#e8b48a','#f97316','#ea580c','#fb923c','#fdba74','#f4efe8','#fffdf8',
  '#0b1220','#0f172a','#0f1726','#070c16','#05080f','#131c2e','#263449','#1a2439','#111a2b',
  '#94a3b8','#64748b','#475569','#334155','#1e293b','#cbd5e1','#e2e8f0','#f1f5f9','#f8fafc',
  '#22c55e','#16a34a','#4ade80','#86efac','#14532d',
  '#ef4444','#f87171','#dc2626','#b91c1c','#7f1d1d',
  '#ffffff','#000000'
)

function ToHsl([int]$r, [int]$g, [int]$b) {
  $rf = $r / 255.0; $gf = $g / 255.0; $bf = $b / 255.0
  $max = [Math]::Max($rf, [Math]::Max($gf, $bf))
  $min = [Math]::Min($rf, [Math]::Min($gf, $bf))
  $l = ($max + $min) / 2.0
  $d = $max - $min
  if ($d -lt 1e-9) { return ,@(0.0, 0.0, $l) }
  if ($l -gt 0.5) { $s = $d / (2.0 - $max - $min) } else { $s = $d / ($max + $min) }
  if ($max -eq $rf) {
    $h = (($gf - $bf) / $d) % 6.0
  } elseif ($max -eq $gf) {
    $h = (($bf - $rf) / $d) + 2.0
  } else {
    $h = (($rf - $gf) / $d) + 4.0
  }
  $h = $h * 60.0
  if ($h -lt 0) { $h = $h + 360.0 }
  return ,@($h, $s, $l)
}

function HueToRgb([double]$p, [double]$q, [double]$t) {
  if ($t -lt 0) { $t = $t + 1.0 }
  if ($t -gt 1) { $t = $t - 1.0 }
  if ($t -lt (1.0 / 6.0)) { return $p + ($q - $p) * 6.0 * $t }
  if ($t -lt 0.5) { return $q }
  if ($t -lt (2.0 / 3.0)) { return $p + ($q - $p) * ((2.0 / 3.0) - $t) * 6.0 }
  return $p
}

function FromHsl([double]$h, [double]$s, [double]$l) {
  if ($s -lt 1e-9) { $v = [int][Math]::Round($l * 255); return ,@($v, $v, $v) }
  if ($l -lt 0.5) { $q = $l * (1.0 + $s) } else { $q = $l + $s - $l * $s }
  $p = 2.0 * $l - $q
  $hn = $h / 360.0
  $rr = [int][Math]::Round((HueToRgb $p $q ($hn + 1.0 / 3.0)) * 255)
  $gg = [int][Math]::Round((HueToRgb $p $q $hn) * 255)
  $bb = [int][Math]::Round((HueToRgb $p $q ($hn - 1.0 / 3.0)) * 255)
  return ,@($rr, $gg, $bb)
}

function TargetHue($h) {
  if ($h -ge 330 -or $h -lt 12) { return 0 }      # red
  if ($h -lt 75)                { return 24 }     # warm
  if ($h -lt 180)               { return 142 }    # green
  return 217                                      # cool
}

function Snap([int]$r, [int]$g, [int]$b) {
  $hsl = ToHsl $r $g $b
  if ($hsl[1] -lt 0.06) { return $null }          # effectively neutral, leave it
  $t = [double](TargetHue $hsl[0])
  $delta = [Math]::Abs($hsl[0] - $t)
  if ($delta -gt 180) { $delta = 360 - $delta }
  if ($delta -lt 2.5) { return $null }
  return (FromHsl $t $hsl[1] $hsl[2])
}

# sanity check the colour maths before touching the stylesheet
$probe = ToHsl 232 180 138
if ([Math]::Abs($probe[0] - 26.4) -gt 1.0) { throw "HSL conversion broken: hue=$($probe[0])" }
$back = FromHsl $probe[0] $probe[1] $probe[2]
if ($back[0] -ne 232 -or $back[1] -ne 180 -or $back[2] -ne 138) { throw "round-trip broken: $back" }

$changed = 0

# ── hex ───────────────────────────────────────────────────────────────────────
$hexes = [regex]::Matches($css, '#[0-9a-fA-F]{6}\b') |
  ForEach-Object { $_.Value.ToLower() } | Select-Object -Unique |
  Where-Object { $canon -notcontains $_ }

foreach ($hx in $hexes) {
  $r = [Convert]::ToInt32($hx.Substring(1, 2), 16)
  $g = [Convert]::ToInt32($hx.Substring(3, 2), 16)
  $b = [Convert]::ToInt32($hx.Substring(5, 2), 16)
  $out = Snap $r $g $b
  if ($null -eq $out) { continue }
  $new = '#{0:x2}{1:x2}{2:x2}' -f $out[0], $out[1], $out[2]
  if ($new -eq $hx) { continue }
  $css = [regex]::Replace($css, [regex]::Escape($hx), $new, 'IgnoreCase')
  $changed++
}

# ── rgb()/rgba() triples ──────────────────────────────────────────────────────
$triples = [regex]::Matches($css, 'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)') |
  ForEach-Object { "$($_.Groups[1].Value),$($_.Groups[2].Value),$($_.Groups[3].Value)" } |
  Select-Object -Unique

foreach ($tr in $triples) {
  $p = $tr -split ','
  $out = Snap ([int]$p[0]) ([int]$p[1]) ([int]$p[2])
  if ($null -eq $out) { continue }
  if ("$($out[0]),$($out[1]),$($out[2])" -eq $tr) { continue }
  $pattern = "(?<=rgba?\(\s*)$($p[0])\s*,\s*$($p[1])\s*,\s*$($p[2])(?=\s*[,)])"
  $css = [regex]::Replace($css, $pattern, "$($out[0]), $($out[1]), $($out[2])")
  $changed++
}

if ($WhatIf) {
  Write-Output "would snap $changed distinct colours"
} else {
  [System.IO.File]::WriteAllText($path, $css, (New-Object System.Text.UTF8Encoding $false))
  Write-Output "snapped $changed distinct colours onto the palette hues"
}
