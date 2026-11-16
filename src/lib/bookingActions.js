import { BOOKING_STATUS as S } from './enums';

// Mirrors BookingService.AllowedTransitions on the backend:
// Requested → Accepted → InProgress → Completed; either party may cancel before completion.
// The provider drives the work forward; the migrant can only cancel.
export function bookingActions(booking, { isProvider }) {
  const actions = [];
  switch (booking.status) {
    case S.Requested:
      if (isProvider) actions.push({ status: S.Accepted, label: 'Accept', primary: true });
      actions.push({ status: S.Cancelled, label: isProvider ? 'Decline' : 'Cancel request', danger: true });
      break;
    case S.Accepted:
      if (isProvider) actions.push({ status: S.InProgress, label: 'Start service', primary: true });
      actions.push({ status: S.Cancelled, label: 'Cancel', danger: true });
      break;
    case S.InProgress:
      if (isProvider) actions.push({ status: S.Completed, label: 'Mark as completed', primary: true });
      actions.push({ status: S.Cancelled, label: 'Cancel', danger: true });
      break;
    default:
      break; // Completed and Cancelled are terminal
  }
  return actions;
}

export const canReview = (booking, { isProvider }) =>
  !isProvider && booking.status === S.Completed && !booking.hasReview;
