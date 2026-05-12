#!/usr/bin/env bash
# Compress + re-encode mp4. Keyframe every 4-6 frames (dense timeline breakpoints).
# Resolution preserved. Output: <name>.compressed.mp4
#
# Usage: ./compress-video.sh input.mp4 [output.mp4] [crf] [gop]
#   crf default 28 (higher = smaller). gop default 5 (keyframe interval in frames).

set -euo pipefail

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "ffmpeg not found. brew install ffmpeg" >&2
  exit 1
fi

input="${1:?input file required}"
crf="${3:-28}"
gop="${4:-5}"

if [[ ! -f "$input" ]]; then
  echo "input not found: $input" >&2
  exit 1
fi

base="${input%.*}"
output="${2:-${base}.compressed.mp4}"

if (( gop < 4 || gop > 6 )); then
  echo "gop must be 4-6 (got $gop)" >&2
  exit 1
fi

# Probe source.
src_size=$(stat -f%z "$input" 2>/dev/null || stat -c%s "$input")
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate \
  -of default=nw=1:nk=1 "$input" | awk -F/ '{ if ($2) printf "%.3f", $1/$2; else print $1 }')

echo "input:  $input ($(numfmt --to=iec --suffix=B "$src_size" 2>/dev/null || echo "$src_size B"))"
echo "fps:    $fps"
echo "gop:    $gop frames (keyframe every ~$(awk -v g="$gop" -v f="$fps" 'BEGIN{printf "%.3f", g/f}')s)"
echo "crf:    $crf"
echo "output: $output"
echo

ffmpeg -hide_banner -y -i "$input" \
  -c:v libx264 \
  -preset slower \
  -crf "$crf" \
  -pix_fmt yuv420p \
  -g "$gop" \
  -keyint_min "$gop" \
  -sc_threshold 0 \
  -force_key_frames "expr:gte(n,n_forced*${gop})" \
  -x264-params "min-keyint=${gop}:keyint=${gop}:scenecut=0:ref=4:bframes=0" \
  -movflags +faststart \
  -c:a aac -b:a 128k -ac 2 \
  "$output"

dst_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output")
ratio=$(awk -v s="$src_size" -v d="$dst_size" 'BEGIN{printf "%.1f", (1-d/s)*100}')

echo
echo "done. $(numfmt --to=iec --suffix=B "$src_size" 2>/dev/null || echo "$src_size B") -> $(numfmt --to=iec --suffix=B "$dst_size" 2>/dev/null || echo "$dst_size B") (-${ratio}%)"
