module.exports = async (metadata, commonTrackId, tokenData) => {
	if (!metadata || !commonTrackId || !tokenData) return;

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const searchParams = new URLSearchParams({
		app_id: "web-desktop-app-v1.0",
		usertoken: tokenData.usertoken,
		commontrack_id: commonTrackId,
	});

	const url = `https://apic-desktop.musixmatch.com/ws/1.1/track.subtitle.get?${searchParams}`;

	try {
		debugLog("Musixmatch lyrics fetch URL:", url);

		debugLog("Running fetch - Musixmatch lyrics")
		const res = await fetch(url, {
			headers: {
				cookie: tokenData.cookies,
			},
		});

		if (!res.ok) {
			warnLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [Musixmatch - Lyrics]`,
			);

			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			return null;
		}

		const data = await res.json();

		if (
			data?.message?.header?.status_code === 401 &&
			data?.message?.header?.hint === "captcha"
		) {
			warnLog(
				"The usertoken has been temporary blocked for too many requests (captcha), retrying in 10 seconds... [Musixmatch - Lyrics]",
			);

			setTimeout(async () => {
				await fetchLyricsMusixmatch(metadata);
			}, 10000); // 10 seconds

			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			return null;
		}

		debugLog("Musixmatch track data:", data?.message?.body);

		const lyrics = data?.message?.body?.subtitle?.subtitle_body;

		if (!lyrics) {
			infoLog("Missing Lyrics [Musixmatch - Lyrics]");

			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			return null;
		}

		infoLog("Successfully fetched and cached the synced lyrics [Musixmatch]");

		cacheData.lyrics = lyrics;

		global.lyricsSource = "Musixmatch";

		global.cachedLyrics = cacheData;

		return lyrics;
	} catch (e) {
		if (
			(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
			global.cachedLyrics?.trackId !== metadata.trackId
		)
			global.cachedLyrics = cacheData;

		errorLog(
			"Something went wrong while fetching the lyrics [Musixmatch - Lyrics]",
			e,
		);

		return null;
	}
};
