module.exports = async (metadata) => {
	if (global.fetching && global.fetchingTrackId === metadata.trackId) {
		warnLog(
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
		infoLog(`Trying to fetch the lyrics from the source "${source}"`);

		if (!Object.keys(avaibleSources).includes(source)) {
			infoLog(`The source "${source}" doesn't exist, skipping...`);

			continue;
		}

		global.fetching = true;
		global.fetchingSource = source;
		global.fetchingTrackId = metadata.trackId;

		const lyrics = await avaibleSources[source](metadata);

		if (lyrics) {
			infoLog(`Got lyrics from the source "${source}"`);

			global.fetching = false;
			global.fetchingSource = null;
			global.fetchingTrackId = null;

			return lyrics;
		}

		infoLog(`The source "${source}" doesn't have the lyrics, skipping...`);
	}

	infoLog("None of the sources have the lyrics");

	return null;
};
