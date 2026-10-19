import os
import sys
import tarfile

packed, archive = sys.argv[1], sys.argv[2]
name = os.path.basename(packed)

launcher = os.path.join(packed, "Calculator")
with open(launcher, "w", newline="\n", encoding="utf-8") as handle:
    handle.write(
        "#!/bin/sh\n"
        "HERE=$(CDPATH= cd -- \"$(dirname -- \"$0\")\" && pwd)\n"
        "exec \"$HERE/calculator-bin\" --no-sandbox --disable-setuid-sandbox \"$@\"\n"
    )

note = os.path.join(packed, "HOW-TO-RUN.txt")
with open(note, "w", newline="\n", encoding="utf-8") as handle:
    handle.write(
        "Calculator 1.0.0 for 64-bit desktop Linux\n\n"
        "  tar -xzf Calculator-linux-x64.tar.gz\n"
        "  cd Calculator-linux-x64\n"
        "  ./Calculator\n\n"
        "Needs GTK 3, NSS, and a running desktop session.\n"
        "Ubuntu or Debian: sudo apt install libgtk-3-0 libnss3 libxss1 libasound2 libgbm1\n"
        "On Ubuntu 24.04 the ALSA package is libasound2t64.\n"
    )

def is_executable(path, base):
    if base in {"Calculator", "calculator-bin", "chrome-sandbox", "chrome_crashpad_handler"}:
        return True
    if ".so" in base:
        return True
    try:
        with open(path, "rb") as handle:
            return handle.read(4) == b"\x7fELF"
    except OSError:
        return False

def reset(info):
    source = os.path.join(os.path.dirname(packed), info.name.replace("/", os.sep))
    base = os.path.basename(info.name)
    if info.isdir():
        info.mode = 0o755
    elif is_executable(source, base):
        info.mode = 0o755
    else:
        info.mode = 0o644
    return info

if os.path.exists(archive):
    os.remove(archive)
with tarfile.open(archive, "w:gz") as tar:
    tar.add(packed, arcname=name, filter=reset)
print(archive)
