export function storeLanguage(lang: string) {
	try {
		localStorage.setItem("LuluArtLanguage", lang);
	} catch (e) {
		// Ignore storage errors
	}
}

export function fetchLanguage(): string | null {
	try {
		return localStorage.getItem("LuluArtLanguage");
	} catch (e) {
		return null;
	}
}

export function getSysLanguage(): "CN" | "EN" {
	const lang = navigator.language || (navigator as any).userLanguage || "";
	const lower = lang.toLowerCase();
	if (lower.startsWith("zh") || lower.startsWith("cn")) {
		return "CN";
	}
	return "EN";
}
