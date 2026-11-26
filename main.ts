/**
 * Make the Judge Laugh in One Line — entry.
 *
 * The bounty's gate is a sealed scorer: /output/entry.txt must be UTF-8 text of
 * 1 to 200 characters, not only whitespace. Past the gate an AI comedy booker
 * reads two lines at a time and picks the funnier one, weighing, in this order:
 * (1) a funny one-line joke a stranger gets in one read, (2) it sets up an
 * expectation and breaks it, (3) every word earns its place and the laugh lands
 * at the end, (4) it is fresh rather than a stock joke or a familiar pun,
 * (5) it reads cleanly out loud with no reference that needs context.
 *
 * The line this program writes:
 *
 *   "My insurer denied the claim because the accident was preventable. I asked
 *    how. They said I could have stayed home. I was home. Asleep."
 *
 * Read against the brief in its own order:
 *
 *  1. One read and it is over. An insurance denial is a scene every adult has
 *     stood in, so nothing needs explaining: a company refuses to pay, gives a
 *     reason, and the reason turns out to describe the customer's own evening.
 *  2. The expectation is a Kafka complaint — the reader braces for the usual
 *     "the insurer is a monster" punchline. The break is bureaucratic literalism
 *     instead: the escape route they named was the place he already was.
 *  3. Four short sentences, no adjectives doing comedy work, and the last word
 *     is the button. "I was home." is the turn; "Asleep." is the second button
 *     that makes the escape route not merely occupied but unconscious.
 *  4. It avoids the whole field's register. The other entries anthropomorphise
 *     a gadget (a smartwatch, a router, a doorbell, a Roomba) and let the object
 *     talk; this one has no object in it at all, only a form letter and a bed.
 *  5. No jargon, no brand, no setup that needs a second sentence of context.
 *
 * The variants cut while converging, and why:
 *   - "I was home." with no button — lands, but leaves the reader to supply the
 *     absurdity; the judge is asked whether the laugh lands at the end, so it
 *     gets a word to land on.
 *   - "In bed." instead of "Asleep." — same length, but a bed is a place and
 *     asleep is a state, and the state is what makes "preventable" ridiculous.
 *   - Opening on "My insurance company" — three syllables of throat-clearing
 *     before the first concrete noun. "Insurer" starts the scene immediately.
 */

import { mkdirSync, writeFileSync } from "node:fs";

/** The gate, verbatim from RULES.txt: "UTF-8 text of 1 to 200 characters". */
const MAX_CHARS = 200;

/** The scene: a company refuses to pay and names the way out. */
const SETUP = "My insurer denied the claim because the accident was preventable.";

/** The question the reader wants answered, asked flatly. */
const ASK = "I asked how.";

/** The refusal, restated as advice: the escape route is a place. */
const ADVICE = "They said I could have stayed home.";

/** The turn: the escape route was already occupied. */
const TURN = "I was home.";

/** The button: occupied, and unconscious, which is the joke. */
const BUTTON = "Asleep.";

/**
 * The field's saturated props, measured from this bounty's own submissions feed
 * at build time (47 entries): smartwatch x3, therapist x3, Roomba, router,
 * doorbell, smoke detector, standing desk, plant, GPS. The brief's example
 * topics are not a menu, and this line holds none of them — the guard keeps a
 * later edit from drifting back into the gadget register that most of the field
 * already occupies.
 */
const SATURATED =
  /\b(smart ?watch|smart ?speaker|roomba|router|doorbell|smoke detector|standing desk|houseplant|plant|gps|thermostat|fridge|toaster|alexa|siri)\b/i;

/** The joke's own invariants: the turn and the button have to still be there. */
const REQUIRED = ["insurer", "preventable", "stayed home", "I was home", "Asleep."];

function compose(): string {
  const text = [SETUP, ASK, ADVICE, TURN, BUTTON].join(" ");

  // The gate is a character count, so count code points rather than UTF-16
  // units; the line is ASCII today and this keeps that honest if it ever is not.
  const chars = [...text].length;
  if (chars < 1) throw new Error("gate: the text is empty");
  if (chars > MAX_CHARS) throw new Error(`gate: ${chars} characters exceeds ${MAX_CHARS}`);
  if (text.trim().length === 0) throw new Error("gate: the text is only whitespace");
  if (/[\r\n]/.test(text)) throw new Error("gate: the artifact must be a single line");
  if (text !== text.normalize("NFC")) throw new Error("gate: the text is not NFC-normalised");

  // Criterion 3 is "the laugh lands at the end instead of being explained", so
  // the button is asserted to be the ending, not merely present somewhere.
  if (!text.endsWith(BUTTON)) throw new Error("criterion 3: the button is no longer the ending");
  if (!/^My insurer denied the claim /.test(text)) {
    throw new Error("criterion 1: it must open on the refusal, or it is a different joke");
  }

  for (const token of REQUIRED) {
    if (!text.includes(token)) throw new Error(`drift: the joke lost "${token}"`);
  }

  const drift = text.match(SATURATED);
  if (drift) {
    throw new Error(`drift: fell back into the field's gadget register: ${JSON.stringify(drift[0])}`);
  }

  // The byte tie-break (RULES.txt, Ranking: an exact rate tie goes to the
  // smaller text) makes every non-ASCII character a cost with no reader benefit.
  // The line is ASCII today; assert it so a curly apostrophe can never sneak in
  // through an edit and quietly buy 2 extra bytes.
  if (Buffer.byteLength(text, "utf8") !== chars) {
    throw new Error("tie-break: the text is not pure ASCII, so bytes exceed characters");
  }

  // Tightness, mechanically: the join above cannot produce a double space, but
  // a later edit that concatenates fragments can, and a double space is a wasted
  // byte plus a stumble when the judge reads the line out loud.
  if (/  /.test(text)) throw new Error("criterion 3: the text carries a double space");

  return text;
}

const dir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const text = compose();
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/entry.txt`, text);

// The report quotes these two numbers; printing them makes a cap breach visible
// in the build log instead of only at the site's gate.
console.log(`chars ${[...text].length} bytes ${Buffer.byteLength(text, "utf8")}`);
console.log(text);
