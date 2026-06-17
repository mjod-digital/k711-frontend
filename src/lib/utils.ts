/**
 * Мерж классов с отсевом falsy-значений.
 * cn(styles.nav, isOpen && styles.open) → "nav open" | "nav"
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
