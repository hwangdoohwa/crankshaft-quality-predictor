param([int]$Rate = 1)
# Record each scene's narration with the Windows Korean voice (Heami); text comes from src/narration.json
Add-Type -AssemblyName System.Speech
$out = Join-Path $PSScriptRoot "public"
$json = [System.IO.File]::ReadAllText((Join-Path $PSScriptRoot "src\narration.json"), [System.Text.Encoding]::UTF8)
$items = $json | ConvertFrom-Json
foreach ($it in $items) {
  $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
  $s.SelectVoice("Microsoft Heami Desktop")
  $s.Rate = $Rate
  $s.SetOutputToWaveFile((Join-Path $out ($it.id + ".wav")))
  $s.Speak($it.text)
  $s.Dispose()
}
