/**
 * Spaced repetition, backed by FSRS.
 *
 * FSRS (Free Spaced Repetition Scheduler) is what Anki moved to; it models
 * memory stability and difficulty per card instead of nudging a fixed ease
 * factor, so a card you keep failing comes back fast without dragging the rest
 * of the deck with it. We vendor `ts-fsrs` (MIT, Open Spaced Repetition) rather
 * than hand-rolling SM-2 again.
 *
 * Swipes map onto two of the four FSRS ratings:
 *   left  → Again  (didn't have it)
 *   right → Good   (said it)
 * A card revealed before the swipe counts as Hard rather than Good, because
 * needing the answer is not the same as producing it.
 */
import { fsrs, createEmptyCard, Rating, State } from '../vendor/ts-fsrs.mjs';

const scheduler = fsrs();

/** A brand-new card's scheduling state, serialisable straight into storage. */
export function newCardState() {
  return serialize(createEmptyCard(new Date()));
}

/**
 * Apply one review.
 * @param {object} state stored scheduling state
 * @param {'again'|'hard'|'good'} outcome
 * @returns {object} the next stored state
 */
export function review(state, outcome) {
  const card = deserialize(state);
  const rating = outcome === 'again' ? Rating.Again
    : outcome === 'hard' ? Rating.Hard
    : Rating.Good;
  const { card: nextCard } = scheduler.next(card, new Date(), rating);
  return serialize(nextCard);
}

/** True when the card is ready to be shown again. */
export function isDue(state, now = new Date()) {
  if (!state || !state.due) return true;
  return new Date(state.due).getTime() <= now.getTime();
}

/** A card that has never been answered correctly is still being learned. */
export function isLearned(state) {
  return Boolean(state) && state.reps > 0 && state.state === State.Review;
}

/** Human-readable "next in …" for the session summary. */
export function dueLabel(state) {
  if (!state || !state.due) return '바로';
  const days = Math.round((new Date(state.due) - Date.now()) / 86400000);
  if (days <= 0) return '오늘 다시';
  if (days === 1) return '내일';
  if (days < 30) return `${days}일 뒤`;
  return `${Math.round(days / 30)}개월 뒤`;
}

/* FSRS hands back Date objects; storage needs plain JSON. */

function serialize(card) {
  return {
    due: card.due instanceof Date ? card.due.toISOString() : card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    last_review: card.last_review instanceof Date
      ? card.last_review.toISOString()
      : card.last_review,
  };
}

function deserialize(state) {
  if (!state) return createEmptyCard(new Date());
  return {
    ...state,
    due: new Date(state.due),
    last_review: state.last_review ? new Date(state.last_review) : undefined,
  };
}
