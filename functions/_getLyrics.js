module.exports = async (metadata) => {
	if (global.fetching && global.fetchingTrackId === metadata.trackId) {
		debugLog(
			`Already fetching from the source "${global.fetchingSource}" (Track ID: "${global.fetchingTrackId}")`,
		);

		return null;
	}

	const avaibleSources = {
		musixmatch: fetchLyricsMusixmatch,
		lrclib: fetchLyricsLrcLib,
	};

	let sources = config?.sources || ["musixmatch", "lrclib"];

	if (sources.every((source) => !Object.keys(avaibleSources).includes(source)))
		sources = ["musixmatch", "lrclib"];

	for (const source of sources) {
		debugLog(`Trying to fetch the lyrics from the source "${source}"`);

		if (!Object.keys(avaibleSources).includes(source)) {
			debugLog(`The source "${source}" doesn't exist, skipping...`);

			continue;
		}

		global.fetching = true;
		global.fetchingSource = source;
		global.fetchingTrackId = metadata.trackId;

		const lyrics = await avaibleSources[source](metadata);

		if (lyrics) {
			debugLog(`Got lyrics from the source "${source}"`);

			global.fetching = false;
			global.fetchingSource = null;
			global.fetchingTrackId = null;

			return lyrics;
		}

		debugLog(`The source "${source}" doesn't have the lyrics`);
	}

	debugLog("None of the sources have the lyrics");

	return null;
};
