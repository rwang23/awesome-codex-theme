#!/bin/sh
set -eu

usage() {
  printf '%s\n' 'Usage: install-theme.sh --theme ID [--mode light|dark] (--base-url URL | --source-root PATH) [--dry-run]'
}

THEME=''
MODE='dark'
BASE_URL=''
SOURCE_ROOT=''
DRY_RUN='false'

while [ "$#" -gt 0 ]; do
  case "$1" in
    --theme)
      THEME=$2
      shift 2
      ;;
    --mode)
      MODE=$2
      shift 2
      ;;
    --base-url)
      BASE_URL=$2
      shift 2
      ;;
    --source-root)
      SOURCE_ROOT=$2
      shift 2
      ;;
    --dry-run)
      DRY_RUN='true'
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      usage >&2
      exit 2
      ;;
  esac
done

case "$THEME" in
  ''|*[!a-z0-9-]*|-*|*-|*--*)
    printf '%s\n' 'Theme id must use lower-case letters, digits, and single hyphens.' >&2
    exit 2
    ;;
esac

case "$MODE" in
  light|dark) ;;
  *)
    printf '%s\n' 'Mode must be light or dark.' >&2
    exit 2
    ;;
esac

if { [ -n "$BASE_URL" ] && [ -n "$SOURCE_ROOT" ]; } || { [ -z "$BASE_URL" ] && [ -z "$SOURCE_ROOT" ]; }; then
  printf '%s\n' 'Provide exactly one of --base-url or --source-root.' >&2
  exit 2
fi

if [ -n "$BASE_URL" ]; then
  case "$BASE_URL" in
    https://*|http://localhost:*|http://127.0.0.1:*) ;;
    *)
      printf '%s\n' 'Remote installs require HTTPS. Plain HTTP is allowed only for loopback development.' >&2
      exit 2
      ;;
  esac
fi

TMP_DIR=$(mktemp -d -t awesome-codex-theme.XXXXXX)
cleanup() {
  case "$TMP_DIR" in
    /tmp/*|/private/tmp/*|/var/folders/*) rm -rf -- "$TMP_DIR" ;;
  esac
}
trap cleanup EXIT HUP INT TERM

REGISTRY_FILE="$TMP_DIR/registry.json"
if [ -n "$SOURCE_ROOT" ]; then
  SOURCE_ROOT=$(cd "$SOURCE_ROOT" && pwd -P)
  cp "$SOURCE_ROOT/themes/registry.json" "$REGISTRY_FILE"
else
  BASE_URL=$(printf '%s' "$BASE_URL" | sed 's:/*$::')
  curl -fsSL "$BASE_URL/themes/registry.json" -o "$REGISTRY_FILE"
fi

REGISTRY_RECORD=$(osascript -l JavaScript - "$REGISTRY_FILE" "$THEME" "$MODE" <<'JXA'
ObjC.import('Foundation');

function readJson(filePath) {
  var value = $.NSString.stringWithContentsOfFileEncodingError(filePath, $.NSUTF8StringEncoding, null);
  if (!value) throw new Error('Could not read registry');
  return JSON.parse(ObjC.unwrap(value));
}

function run(argv) {
  var registry = readJson(argv[0]);
  if (registry.standard !== 'act-theme-pack-v1') throw new Error('Unsupported registry standard');
  var matches = registry.themes.filter(function (item) { return item.id === argv[1]; });
  if (matches.length !== 1) throw new Error('Theme was not found exactly once');
  var mode = matches[0].previews[argv[2]];
  return [
    mode.adapterBundle.path,
    mode.adapterBundle.sha256,
    mode.adapterBundle.bytes,
    mode.assetSha256,
    mode.assetBytes
  ].join('\t');
}
JXA
)

OLD_IFS=$IFS
IFS=$(printf '\t')
set -- $REGISTRY_RECORD
IFS=$OLD_IFS
BUNDLE_PATH=$1
BUNDLE_SHA=$2
BUNDLE_BYTES=$3
ASSET_SHA=$4
ASSET_BYTES=$5

case "$BUNDLE_PATH" in
  /*|*\\*|*:*|../*|*/../*|*/..)
    printf '%s\n' 'Registry bundle path is unsafe.' >&2
    exit 1
    ;;
esac

BUNDLE_FILE="$TMP_DIR/adapter.zip"
if [ -n "$SOURCE_ROOT" ]; then
  cp "$SOURCE_ROOT/$BUNDLE_PATH" "$BUNDLE_FILE"
else
  curl -fsSL "$BASE_URL/$BUNDLE_PATH" -o "$BUNDLE_FILE"
fi

ACTUAL_BUNDLE_BYTES=$(wc -c < "$BUNDLE_FILE" | tr -d ' ')
ACTUAL_BUNDLE_SHA=$(shasum -a 256 "$BUNDLE_FILE" | awk '{print $1}')
if [ "$ACTUAL_BUNDLE_BYTES" != "$BUNDLE_BYTES" ] || [ "$ACTUAL_BUNDLE_SHA" != "$BUNDLE_SHA" ]; then
  printf '%s\n' 'Adapter bundle integrity verification failed.' >&2
  exit 1
fi

EXPANDED="$TMP_DIR/expanded"
mkdir "$EXPANDED"
ditto -x -k "$BUNDLE_FILE" "$EXPANDED"
THEME_FILE="$EXPANDED/dream-skin/theme.json"
BACKGROUND_FILE="$EXPANDED/dream-skin/background.png"
EXPECTED_ID="act-$THEME-$MODE"

MANIFEST_RECORD=$(osascript -l JavaScript - "$THEME_FILE" <<'JXA'
ObjC.import('Foundation');

function run(argv) {
  var value = $.NSString.stringWithContentsOfFileEncodingError(argv[0], $.NSUTF8StringEncoding, null);
  if (!value) throw new Error('Could not read Dream Skin manifest');
  var theme = JSON.parse(ObjC.unwrap(value));
  return [theme.schemaVersion, theme.id, theme.image, theme.appearance].join('\t');
}
JXA
)

IFS=$(printf '\t')
set -- $MANIFEST_RECORD
IFS=$OLD_IFS
if [ "$1" != '1' ] || [ "$2" != "$EXPECTED_ID" ] || [ "$3" != 'background.png' ] || [ "$4" != "$MODE" ]; then
  printf '%s\n' 'Dream Skin manifest verification failed.' >&2
  exit 1
fi

ACTUAL_ASSET_BYTES=$(wc -c < "$BACKGROUND_FILE" | tr -d ' ')
ACTUAL_ASSET_SHA=$(shasum -a 256 "$BACKGROUND_FILE" | awk '{print $1}')
if [ "$ACTUAL_ASSET_BYTES" != "$ASSET_BYTES" ] || [ "$ACTUAL_ASSET_SHA" != "$ASSET_SHA" ]; then
  printf '%s\n' 'Dream Skin background integrity verification failed.' >&2
  exit 1
fi

if [ "$DRY_RUN" = 'true' ]; then
  printf 'Verified %s (%s) without writing user state.\n' "$THEME" "$MODE"
  exit 0
fi

INSTALL_ROOT="$HOME/Library/Application Support/CodexDreamSkinStudio/themes"
TARGET="$INSTALL_ROOT/$EXPECTED_ID"
if [ -L "$INSTALL_ROOT" ] || [ -L "$TARGET" ]; then
  printf '%s\n' 'Refusing to write through a symbolic link.' >&2
  exit 1
fi
mkdir -p "$TARGET"
cp "$BACKGROUND_FILE" "$TARGET/background.png.new"
cp "$THEME_FILE" "$TARGET/theme.json.new"
mv -f "$TARGET/background.png.new" "$TARGET/background.png"
mv -f "$TARGET/theme.json.new" "$TARGET/theme.json"

printf 'Installed %s (%s) to %s\n' "$THEME" "$MODE" "$TARGET"
printf '%s\n' 'Open Codex Dream Skin and select the newly installed theme.'
