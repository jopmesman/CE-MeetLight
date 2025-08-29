// Tracking van actieve Meet tabs
const activeMeetTabIds = new Set();

// Lees configuratie uit storage
async function getConfig() {
	return new Promise((resolve) => {
		chrome.storage.sync.get(
			{ hueBridgeIp: "", hueUsername: "", hueLightId: "" },
			(items) => resolve(items)
		);
	});
}

function isHueConfigured(cfg) {
	return Boolean(cfg.hueBridgeIp && cfg.hueUsername && cfg.hueLightId);
}

async function setHueLightState(on) {
	const cfg = await getConfig();
	if (!isHueConfigured(cfg)) {
		console.warn("MeetLight: Hue niet geconfigureerd");
		return;
	}
	const url = `http://${cfg.hueBridgeIp}/api/${cfg.hueUsername}/lights/${cfg.hueLightId}/state`;
	try {
		await fetch(url, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ on })
		});
		console.log("MeetLight: Hue state gezet", on);
	} catch (err) {
		console.error("MeetLight: Fout bij zetten Hue state", err);
	}
}

function updateHueBasedOnActiveTabs() {
	const anyActive = activeMeetTabIds.size > 0;
	setHueLightState(anyActive);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
	if (msg && msg.type === "MEETLIGHT_MEET_STATUS") {
		const tabId = sender?.tab?.id;
		if (typeof tabId !== "number") return;
		if (msg.active === true) {
			activeMeetTabIds.add(tabId);
		} else if (msg.active === false) {
			activeMeetTabIds.delete(tabId);
		}
		updateHueBasedOnActiveTabs();
		sendResponse({ ok: true });
	}
});

chrome.tabs.onRemoved.addListener((tabId) => {
	if (activeMeetTabIds.delete(tabId)) {
		updateHueBasedOnActiveTabs();
	}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url && !tab.url.startsWith("https://meet.google.com")) {
		if (activeMeetTabIds.delete(tabId)) {
			updateHueBasedOnActiveTabs();
		}
	}
}); 