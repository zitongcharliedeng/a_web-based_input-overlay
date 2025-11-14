/**
 * Show a toast notification to the user
 * @param message - The message to display
 * @param duration - Duration in milliseconds (default: 2000)
 */
export function showToast(message: string, duration: number = 2000): void {
	const container = document.getElementById('toastContainer');
	if (!container) {
		console.warn('[Toast] Container not found');
		return;
	}

	const toast = document.createElement('div');
	toast.className = 'BoxWhichNotifiesUserOfStatusUpdates';
	toast.textContent = message;

	container.appendChild(toast);

	// Remove toast after animation completes
	setTimeout(() => {
		if (toast.parentNode) {
			toast.parentNode.removeChild(toast);
		}
	}, duration);
}
