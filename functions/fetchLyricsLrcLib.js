module.exports = async (metadata) => {
	if (!metadata) return;

	debugLog(
		`Fetching the lyrics for "${metadata.track}" from "${metadata.album}" from "${metadata.artist}" (${metadata.trackId}) [LRCLIB]`,
	);

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const searchParams = new URLSearchParams({
		track_name: metadata.track,
		artist_name: metadata.artist,
		album_name: metadata.album,
		q: metadata.track,
	});

	const url = `https://lrclib.net/api/search?${searchParams}`;

	try {
		const res = await fetch(url, {
			headers: {
				"Lrclib-Client":
					"SyncLyrics (https://github.com/Stef-00012/SyncLyrics)",
				"User-Agent": "SyncLyrics (https://github.com/Stef-00012/SyncLyrics)",
			},
		});

		if (!res.ok) {
			debugLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [LRCLIB]`,
			);

			global.cachedLyrics = cacheData;

			return null;
		}

		const data = await res.json();

		const match = data.find(
			(d) => d.artistName === metadata.artist && d.trackName === metadata.track,
		);

		if (!match || !match.syncedLyrics || match.syncedLyrics?.length <= 0) {
			debugLog("The fetched song does not have synced lyrics [LRCLIB]");

			global.cachedLyrics = cacheData;

			return null;
		}

		debugLog("Successfully fetched and cached the synced lyrics [LRCLIB]");

		cacheData.lyrics = match.syncedLyrics;

		global.cachedLyrics = cacheData;

		global.lyricsSource = "lrclib.net";

		return match.syncedLyrics;
	} catch (e) {
		global.cachedLyrics = cacheData;

		debugLog("Something went wrong while fetching the lyrics [LRCLIB]");

		return null;
	}
};
