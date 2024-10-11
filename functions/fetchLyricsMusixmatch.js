module.exports = async (metadata) => {
	if (!metadata) return;

	const tokenData = await getMusixmatchUsertoken();

	debugLog("Musixmatch token data:", tokenData);

	if (!tokenData) return null;

	infoLog(
		`Fetching the lyrics for "${metadata.track}" from "${metadata.album}" from "${metadata.artist}" (${metadata.trackId}) [Musixmatch]`,
	);

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const commonTrackId = await _searchLyricsMusixmatch(metadata, tokenData);

	if (!commonTrackId) {
		infoLog("Missing commontrack_id [Musixmatch - Search]");

		if (
			(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
			global.cachedLyrics?.trackId !== metadata.trackId
		)
			global.cachedLyrics = cacheData;

		return null;
	}

	const lyrics = await _fetchLyricsMusixmatch(
		metadata,
		commonTrackId,
		tokenData,
	);

	return lyrics;
};
