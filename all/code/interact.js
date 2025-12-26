(function () {
	// State to track interaction
	let hasInteracted = false;

	// Timestamp when the user arrived
	const startTime = Date.now();

	// Define what constitutes an "interaction"
	const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart', 'input'];

	// Function to handle the first interaction
	const handleInteraction = () => {
		hasInteracted = true;

		// Performance: Remove listeners immediately after first interaction.
		// We only care IF they interacted, not how many times.
		interactionEvents.forEach(event => {
			window.removeEventListener(event, handleInteraction);
		});

		console.log("User is active. Tracking stopped.");
	};

	// Attach event listeners
	interactionEvents.forEach(event => {
		// { passive: true } improves scrolling performance
		window.addEventListener(event, handleInteraction, { passive: true, once: true });
	});

	// Detect when the user leaves the page
	document.addEventListener('visibilitychange', () => {
		// trigger when the page becomes hidden (tab switch, close, minimize)
		if (document.visibilityState === 'hidden') {

			const timeSpent = Date.now() - startTime;

			// Prepare the data payload
			const payload = JSON.stringify({
				hasInteracted: hasInteracted, // false = "did nothing else"
				timeOnPage: timeSpent,        // duration in ms
				url: window.location.href
			});

			// Logic: If hasInteracted is FALSE, they visited and did nothing.
			if (!hasInteracted) {
				console.log(`User left after ${timeSpent}ms doing NOTHING.`);

				// SEND DATA TO SERVER
				// navigator.sendBeacon is robust for page unload events
				const blob = new Blob([payload], { type: 'application/json' });
				navigator.sendBeacon('/api/track-inactive-visit', blob);
			} else {
				console.log(`User left after ${timeSpent}ms but was active.`);
			}
		}
	});
})();