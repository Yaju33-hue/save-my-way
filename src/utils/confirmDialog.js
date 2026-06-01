/**
 * Shows a confirmation dialog by temporarily changing the delete button text
 * User must click "Confirm?" within the time window to execute the action
 */
export function confirmDeleteAction(onConfirm, timeoutMs = 3000) {
  // For now, use the standard window.confirm
  // This can be enhanced later with a custom UI dialog
  if (window.confirm("Are you sure you want to delete this entry?")) {
    onConfirm();
  }
}
