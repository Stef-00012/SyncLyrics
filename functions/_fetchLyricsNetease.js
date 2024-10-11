module.exports = async (metadata, trackId) => {
	if (!metadata || !trackId) return;

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const searchParams = new URLSearchParams({
		id: trackId,
	});

	const url = `https://music.xianqiao.wang/neteaseapiv2/lyric?${searchParams}`;

	try {
		debugLog("Netease lyrics fetch URL:", url);

		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0",
			},
		});

		if (!res.ok) {
			warnLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [Netease - Lyrics]`,
			);

			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			return null;
		}

		const data = await res.json();

		debugLog("Netease track data:", data);

		let lyrics = data?.lrc?.lyric;

		if (!lyrics) {
			infoLog("Missing Lyrics [Netease - Lyrics]");

			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			return null;
		}

		lyrics = _parseNeteaseLyrics(lyrics);

		infoLog("Successfully fetched and cached the synced lyrics [Netease]");

		cacheData.lyrics = lyrics;

		global.lyricsSource = "Netease";

		global.cachedLyrics = cacheData;

		return lyrics;
	} catch (e) {}
};
