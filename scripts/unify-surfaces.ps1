# Third stage: a dark, muted warm colour is a *surface*, not an accent — it is
# what made some pages read brown while others read navy. Those move onto the
# cool 217deg family. Bright, saturated warm colours are the accent voice and
# are left alone.
#
# Run:  pwsh -File scripts/unify-surfaces.ps1 [-WhatIf]

param([switch]$WhatIf)

$path = Join-Path $PSScriptRoot '..\src\app\globals.css'
$css = [System.IO.File]::ReadAllText($path)

function ToHsl([int]$r, [int]$g, [int]$b) {
  $rf = $r / 255.0; $gf = $g / 255.0; $bf = $b / 255.0
  $max = [Math]::Max($rf, [Math]::Max($gf, $bf))
  $min = [Math]::Min($rf, [Math]::Min($gf, $bf))
  $l = ($max + $min) / 2.0
  $d = $max - $min
  if ($d -lt 1e-9) { return ,@(0.0, 0.0, $l) }
  if ($l -gt 0.5) { $s = $d / (2.0 - $max - $min) } else { $s = $d / ($max + $min) }
  if ($max -eq $rf) { $h = (($gf - $bf) / $d) % 6.0 }
  elseif ($max -eq $gf) { $h = (($bf - $rf) / $d) + 2.0 }
  else { $h = (($rf - $gf) / $d) + 4.0 }
  $h = $h * 60.0
  if ($h -lt 0) { $h += 360.0 }
  return ,@($h, $s, $l)
}

function HueToRgb([double]$p, [double]$q, [double]$t) {
  if ($t -lt 0) { $t += 1.0 }
  if ($t -gt 1) { $t -= 1.0 }
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
  return ,@(
    [int][Math]::Round((HueToRgb $p $q ($hn + 1.0 / 3.0)) * 255),
    [int][Math]::Round((HueToRgb $p $q $hn) * 255),
    [int][Math]::Round((HueToRgb $p $q ($hn - 1.0 / 3.0)) * 255)
  )
}

# A warm colour that is dark and muted is scenery, not signal.
function IsSurface($hsl) {
  return ($hsl[0] -ge 10 -and $hsl[0] -le 80) -and $hsl[2] -lt 0.34 -and $hsl[1] -lt 0.5
}

$changed = @()

$hexes = [regex]::Matches($css, '#[0-9a-fA-F]{6}\b') |
  ForEach-Object { $_.Value.ToLower() } | Select-Object -Unique

foreach ($hx in $hexes) {
  $r = [Convert]::ToInt32($hx.Substring(1, 2), 16)
  $g = [Convert]::ToInt32($hx.Substring(3, 2), 16)
  $b = [Convert]::ToInt32($hx.Substring(5, 2), 16)
  $hsl = ToHsl $r $g $b
  if (-not (IsSurface $hsl)) { continue }
  $out = FromHsl 217.0 ([Math]::Min($hsl[1], 0.34)) $hsl[2]
  $new = '#{0:x2}{1:x2}{2:x2}' -f $out[0], $out[1], $out[2]
  if ($new -eq $hx) { continue }
  $css = [regex]::Replace($css, [regex]::Escape($hx), $new, 'IgnoreCase')
  $changed += "$hx -> $new"
}

$triples = [regex]::Matches($css, 'rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)') |
  ForEach-Object { "$($_.Groups[1].Value),$($_.Groups[2].Value),$($_.Groups[3].Value)" } |
  Select-Object -Unique

foreach ($tr in $triples) {
  $p = $tr -split ','
  $hsl = ToHsl ([int]$p[0]) ([int]$p[1]) ([int]$p[2])
  if (-not (IsSurface $hsl)) { continue }
  $out = FromHsl 217.0 ([Math]::Min($hsl[1], 0.34)) $hsl[2]
  if ("$($out[0]),$($out[1]),$($out[2])" -eq $tr) { continue }
  $pattern = "(?<=rgba?\(\s*)$($p[0])\s*,\s*$($p[1])\s*,\s*$($p[2])(?=\s*[,)])"
  $css = [regex]::Replace($css, $pattern, "$($out[0]), $($out[1]), $($out[2])")
  $changed += "rgb($tr) -> rgb($($out[0]), $($out[1]), $($out[2]))"
}

$changed | ForEach-Object { "  $_" }
if ($WhatIf) {
  Write-Output "would move $($changed.Count) colours onto the cool surface family"
} else {
  [System.IO.File]::WriteAllText($path, $css, (New-Object System.Text.UTF8Encoding $false))
  Write-Output "moved $($changed.Count) colours onto the cool surface family"
}
