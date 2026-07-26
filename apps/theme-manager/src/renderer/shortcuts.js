const SHORTCUT_RESERVED_TARGETS = [
  "input",
  "textarea",
  "select",
  "a[href]",
  "button",
  "[contenteditable='true']",
  "[role='button']",
  "[role='checkbox']",
  "[role='combobox']",
  "[role='dialog']",
  "[role='menuitem']",
  "[role='radio']",
  "[role='slider']",
  "[role='switch']",
  "[role='tab']",
  "[role='textbox']",
].join(", ");

export function hasNonCollapsedSelection(selection) {
  return Boolean(selection && !selection.isCollapsed);
}

export function isEditableOrInteractiveTarget(target) {
  return Boolean(target?.isContentEditable || target?.closest?.(SHORTCUT_RESERVED_TARGETS));
}

export function canUseGlobalActionShortcut({ dialogOpen, selection, target }) {
  return !dialogOpen
    && !hasNonCollapsedSelection(selection)
    && !isEditableOrInteractiveTarget(target);
}
