/**
 * Short hype lines for KO/Kill/Flashy/Upset.
 * Hook this to the fight resolution signals.
 */
export function commentatorFor(tag: 'KO'|'Kill'|'Flashy'|'Upset'): string {
  switch (tag) {
    case 'KO': return 'What a knockout! The crowd erupts!';
    case 'Kill': return 'A fatal finish—steel and silence. The arena gasps.';
    case 'Flashy': return 'Spectacle! Flourishes and feints—pure theatre!';
    case 'Upset': return 'An upset for the ages! The favorite falls.';
  }
}