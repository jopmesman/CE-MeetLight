// Detectie van actieve Google Meet call
function isMeetActive() {
	// Heuristiek: als er video-elementen/audio met stream spelen, of de call UI aanwezig is
	const videoEl = document.querySelector("video");
	const inCallUI = document.querySelector('[data-call-ended], [data-session-id], [aria-label^="Leave call"], [aria-label^="Deelnemen"], [aria-label^="Leave"]');
	return Boolean(videoEl || inCallUI);
}

let lastState = null;

function reportState(active) {
	chrome.runtime.sendMessage({ type: "MEETLIGHT_MEET_STATUS", active });
}

function checkAndReport() {
	const active = isMeetActive() && !document.hidden;
	if (lastState !== active) {
		lastState = active;
		reportState(active);
	}
}

const observer = new MutationObserver(() => checkAndReport());
observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true });

document.addEventListener("visibilitychange", checkAndReport, { passive: true });
window.addEventListener("focus", checkAndReport, { passive: true });
window.addEventListener("blur", checkAndReport, { passive: true });

// Eerste check
checkAndReport(); 