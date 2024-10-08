module.exports = async (metadata) => {
	if (!metadata) return;

	const tokenData = await getMusixmatchUsertoken();

	if (!tokenData) return null;

	infoLog(
		`Fetching the lyrics for "${metadata.track}" from "${metadata.album}" from "${metadata.artist}" (${metadata.trackId}) [Musixmatch]`,
	);

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const rootUrl = "https://apic-desktop.musixmatch.com//ws/1.1";

	const defaultSearchParams = new URLSearchParams({
		app_id: "web-desktop-app-v1.0",
		usertoken: tokenData.usertoken,
	});

	const searchUrl = `${rootUrl}/track.search?${defaultSearchParams}`;
	const lyricsUrl = `${rootUrl}/track.subtitle.get?${defaultSearchParams}`;

	const searchSearchParams = new URLSearchParams({
		q_track: metadata.track,
		q_artist: metadata.artist,
		q_album: metadata.album,
		page_size: 20,
		page: 1,
		f_has_subtitles: 1,
	});

	let commonTrackId;

	try {
		const res = await fetch(`${searchUrl}&${searchSearchParams}`, {
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
				listItem.track.track_name?.toLowerCase() === metadata.track?.toLowerCase() &&
				listItem.track.artist_name?.toLowerCase() === metadata.artist?.toLowerCase(),
		);

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

	if (!commonTrackId) {
		infoLog("Missing commontrack_id [Musixmatch - Search]");

		if (
			(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
			global.cachedLyrics?.trackId !== metadata.trackId
		)
			global.cachedLyrics = cacheData;

		return null;
	}

	const lyricsSearchParams = new URLSearchParams({
		commontrack_id: commonTrackId,
	});

	try {
		const res = await fetch(`${lyricsUrl}&${lyricsSearchParams}`, {
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

		infoLog("Successfully fetched and cached the synced lyrics [LRCLIB]");

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
