module.exports = async (metadata) => {
	if (!metadata) return;

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const trackId = await _searchLyricsNetease(metadata);

	if (!trackId) {
		infoLog("Missing track ID [Netease - Search]");

		if (
			(!global.cachedLyrics || !global.cachedLyrics?.lyrics) &&
			global.cachedLyrics?.trackId !== metadata.trackId
		)
			global.cachedLyrics = cacheData;

		return null;
	}

	const lyrics = await _fetchLyricsNetease(metadata, trackId);

	return lyrics;
};
