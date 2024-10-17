module.exports = async (metadata) => {
	const searchParams = new URLSearchParams({
		limit: 10,
		type: 1,
		keywords: `${metadata.track} ${metadata.artist}`,
	});

	const url = `https://music.xianqiao.wang/neteaseapiv2/search?${searchParams}`;

	try {
		debugLog("Netease search fetch URL:", url);

		debugLog('Running fetch - Netease search')
		const res = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:93.0) Gecko/20100101 Firefox/93.0",
			},
		});

		if (!res.ok) {
			warnLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [Netease - Search]`,
			);

			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			return null;
		}

		const data = await res.json();

		if (!data?.result?.songs || data?.result?.songs?.length <= 0) {
			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			infoLog("No songs were found [Netease - Search]");

			return null;
		}

		const track = data?.result?.songs?.find(
			(listItem) =>
				listItem.name?.toLowerCase() === metadata.track?.toLowerCase() &&
				// listItem.album?.name?.toLowerCase() === metadata.album?.toLowerCase() &&
				listItem.artists.some((artist) =>
					artist.name?.toLowerCase()?.includes(metadata.artist?.toLowerCase()),
				),
		);

		debugLog("Netease search filtered track:", track);

		if (!track) {
			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			infoLog(
				"No songs were found with the current name and artist [Netease - Search]",
			);

			return null;
		}

		const trackId = track.id;

		debugLog("Neteasw track ID", trackId);

		return trackId;
	} catch (e) {
		if (
			(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
			global.cachedLyrics?.trackId !== metadata.trackId
		)
			global.cachedLyrics = cacheData;

		errorLog(
			"Something went wrong while fetching the lyrics [Netease - Search]",
			e,
		);

		return null;
	}
};
