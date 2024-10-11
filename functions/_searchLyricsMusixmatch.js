module.exports = async (metadata, tokenData) => {
	if (!metadata || !tokenData) return;

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

    const duration = metadata.length / 1000

	const searchParams = new URLSearchParams({
		app_id: "web-desktop-app-v1.0",
		usertoken: tokenData.usertoken,
		q_track: metadata.track,
		q_artist: metadata.artist,
		q_album: metadata.album,
		page_size: 20,
		page: 1,
		f_has_subtitle: 1,
        q_duration: duration,
        f_subtitle_length: Math.floor(duration),
	});

	const url = `https://apic-desktop.musixmatch.com/ws/1.1/track.search?${searchParams}`;

	try {
		debugLog("Musixmatch search fetch URL:", url);

		const res = await fetch(url, {
			headers: {
				cookie: tokenData.cookies,
			},
		});

		if (!res.ok) {
			warnLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [Musixmatch - Search]`,
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
				"The usertoken has been temporary blocked for too many requests (captcha) [Musixmatch - Search]",
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

		debugLog("Musixmatch search results:", data?.message?.body?.track_list);

		if (data?.message?.body?.track_list?.length <= 0) {
			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			infoLog("No songs were found [Musixmatch - Search]");

			return null;
		}

		const track = data?.message?.body?.track_list?.find(
			(listItem) =>
				listItem.track.track_name?.toLowerCase() ===
					metadata.track?.toLowerCase() &&
				listItem.track.artist_name
					?.toLowerCase()
					.includes(metadata.artist?.toLowerCase()),
		);

		debugLog("Musixmatch search filtered track:", track);

		if (!track) {
			if (
				(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
				global.cachedLyrics?.trackId !== metadata.trackId
			)
				global.cachedLyrics = cacheData;

			infoLog(
				"No songs were found with the current name and artist [Musixmatch - Search]",
			);

			return null;
		}

		commonTrackId = track?.track?.commontrack_id;

		debugLog("Musixmatch commontrack_id", commonTrackId);

		return commonTrackId;
	} catch (e) {
		if (
			(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
			global.cachedLyrics?.trackId !== metadata.trackId
		)
			global.cachedLyrics = cacheData;

		errorLog(
			"Something went wrong while fetching the lyrics [Musixmatch - Search]",
			e,
		);

		return null;
	}
};
