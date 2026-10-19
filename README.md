![Calculator in standard mode](docs/screenshot-rechner.png)

# Win Calc — REA Clone

Unofficial desktop calculator. The installed app was inspected with REA (Reverse Engineer Anything), then rebuilt as a separate program. Same job, own code.

## Download 1.0.0

- Windows x64: [Calculator.exe](https://github.com/LuiInventions/Win_Calc-REA-Clone/releases/download/v1.0.0/Calculator.exe)
- Linux x64: [Calculator-linux-x64.tar.gz](https://github.com/LuiInventions/Win_Calc-REA-Clone/releases/download/v1.0.0/Calculator-linux-x64.tar.gz)
- Both files: [release 1.0.0](https://github.com/LuiInventions/Win_Calc-REA-Clone/releases/tag/v1.0.0)

Linux:

- `tar -xzf Calculator-linux-x64.tar.gz`
- `cd Calculator-linux-x64`
- `./Calculator`
- Desktop session with GTK 3 and NSS. Ubuntu or Debian: `sudo apt install libgtk-3-0 libnss3 libxss1 libasound2 libgbm1` (Ubuntu 24.04: `libasound2t64` instead of `libasound2`)

Windows:

- Run `Calculator.exe`
- Windows 10 or 11 x64
- WebView2 runtime, already included on current Windows 11

## What it does

Calculator:

- Standard. Left to right, so `2 + 3 × 4` is 20
- Scientific. Operator precedence, so the same input is 14
- Graphing. Plots `y = f(x)`
- Programmer. Fixed-width integers, two's complement, bases 16, 10, 8, and 2
- Date. Difference, add days, subtract days

Converter:

- Currency, volume, length, weight and mass, temperature, energy, area, speed, time, power, data, pressure, angle

Also:

- Memory, history, and keyboard input
- Sample euro rates for currency. No live rates
- German labels, from the PC the app was built on
- Window opens at 320 × 533, minimum 320 × 500

## How it was built

- REA read the local program files and kept evidence separate from guesses
- Visible: package identity, type and method names, strings, control names
- Not visible: method bodies of the calculation core. No decompiler was set up, so there is no pseudocode of that core
- This repository is a new HTML, CSS, and JavaScript app plus a small window host
- Windows host: WebView2, borderless, files unpacked on launch
- Linux host: Electron window around the same page. Its icon is separate from the Windows icon
- Currency API key and the original icon font were left out

## Layout

```
index.html              Page
css/app.css             Layout and theme
js/engine.js            Calculation
js/units.js             Unit factors
js/app.js               Interface
test-engine.js          Engine checks
launcher/Program.cs     Windows window
launcher/build.ps1      Rebuilds the Windows exe
launcher/linux/         Linux window and pack script
release/Calculator.exe  Windows app checked into the repo
docs/screenshot-rechner.png
```

## Rebuild

Windows, from `launcher`:

```
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Writes `release/Rechner.exe`. The script expects a local calculator install when it builds the window icon.

Linux, from `launcher/linux`:

```
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1
```

Writes `release/Calculator-linux-x64.tar.gz`. The script downloads the Electron 30.5.1 Linux x64 runtime on first run.

Engine checks, from the repo root:

```
node test-engine.js
```

The checks cover the engine, not the window.

## Limits

- Experimental reconstruction. Results are not guaranteed to match the original bit for bit
- Unit factors are SI and conventional values, including Kelvin for temperature. They were not copied from an original factor table
- The graph is a custom plot
- The Linux package is x64 only
