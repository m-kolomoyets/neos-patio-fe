#!/usr/bin/env bash
# Download each patio's remote previewBackground image and generate a low-res LQIP.
# Outputs per patio into public/images/patios/<slug>/:
#   background.jpg      raw download, untouched
#   background-low.jpg  640px-wide, JPEG quality 60
#
# Slug|URL pairs mirror the active entries in src/services/patios/fixtures.ts.
# Re-runnable: always overwrites. Bad downloads are logged and skipped; the
# script exits non-zero if any patio failed.
#
# Usage: ./scripts/gen-patio-backgrounds.sh

set -uo pipefail

if ! command -v sips >/dev/null 2>&1; then
  echo "sips not found (macOS only)" >&2
  exit 1
fi

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
out_root="${script_dir}/../public/images/patios"

low_width=640
low_quality=60

# slug|url
patios=(
  "mont-saint-michel|https://patiostorage.blob.core.windows.net/assets/Mont%20Saint%20Michel.jpg"
  "national-gallery-of-denmark|https://patiostorage.blob.core.windows.net/assets/National%20Gallery%20of%20Denmark.jpg"
  "elbe-philharmonic-hall|https://patiostorage.blob.core.windows.net/assets/Elbe%20Philharmonic%20Hall.jpg"
  "bethesda-terrace|https://patiostorage.blob.core.windows.net/assets/Bethesda%20Terrace.jpg"
  "castillo-de-chambord|https://patiostorage.blob.core.windows.net/assets/Ch%C3%A2teau%20de%20Chambord.jpg"
  "colosseo|https://patiostorage.blob.core.windows.net/assets/Colosseo.jpg"
  "eiffel-tower|https://patiostorage.blob.core.windows.net/assets/Eiffel%20Tower.jpg"
  "griffith-observatory|https://patiostorage.blob.core.windows.net/assets/Griffith%20Observatory.jpg"
  "guggenheim-new-york|https://patiostorage.blob.core.windows.net/assets/Guggenheim%20New%20York.jpg"
  "madison-square-garden|https://patiostorage.blob.core.windows.net/assets/Madison%20Square%20Garden.jpg"
  "prague-castle|https://patiostorage.blob.core.windows.net/assets/Prague%20Castle.jpg"
  "sagrada-familia|https://patiostorage.blob.core.windows.net/assets/Sagrada%20Fam%C3%ADlia.jpg"
  "todai-ji|https://patiostorage.blob.core.windows.net/assets/T%C5%8Ddai-ji.jpg"
  "washington-monument|https://patiostorage.blob.core.windows.net/assets/Washington%20Monument.jpg"
)

failed=()

for entry in "${patios[@]}"; do
  slug="${entry%%|*}"
  url="${entry#*|}"
  dir="${out_root}/${slug}"
  full="${dir}/background.jpg"
  low="${dir}/background-low.jpg"

  mkdir -p "$dir"
  echo "→ ${slug}"

  if ! curl -fsSL "$url" -o "$full"; then
    echo "  download failed" >&2
    failed+=("$slug")
    rm -f "$full"
    continue
  fi

  if [[ ! -s "$full" ]]; then
    echo "  empty download" >&2
    failed+=("$slug")
    rm -f "$full"
    continue
  fi

  cp "$full" "$low"
  if ! sips -Z "$low_width" -s format jpeg -s formatOptions "$low_quality" "$low" >/dev/null 2>&1; then
    echo "  low-res generation failed" >&2
    failed+=("$slug")
    rm -f "$low"
    continue
  fi

  echo "  ok ($(stat -f%z "$full") b full, $(stat -f%z "$low") b low)"
done

echo
if (( ${#failed[@]} > 0 )); then
  echo "FAILED: ${failed[*]}" >&2
  exit 1
fi
echo "All ${#patios[@]} patios done."
