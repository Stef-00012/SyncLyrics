const path = require("node:path");
const fs = require("node:fs");

module.exports = async (metadata) => {
	const trackId = metadata.trackId.split("/").pop();

	const localLyricsFile = path.join(configFolder, "lyrics", `${trackId}.txt`);

	if (fs.existsSync(localLyricsFile)) {
		infoLog("Loading lyrics from local file");

		const lyrics = fs.readFileSync(localLyricsFile, "utf-8");

		if (lyrics.length > 0 && lyrics.startsWith("[")) {
			global.lyricsSource = "Local File";

			return lyrics;
		}
	}

	if (!global.cachedLyrics) {
		infoLog("No cached lyrics, fetching the song data");

		global.lyricsCached = false;

		return await _getLyrics(metadata);
	}

	if (metadata.trackId !== global.cachedLyrics.trackId) {
		infoLog(
			"Cached song is different from current song, fetching the song data",
		);

		global.cachedLyrics = null;
		global.lyricsCached = false;

		return await _getLyrics(metadata);
	}

	if (!global.cachedLyrics.lyrics) {
		infoLog("Cached lyrics are null");

		global.lyricsCached = false;

		return null;
	}

	global.fetchingTrackId = null;
	global.fetchingSource = null;
	global.lyricsCached = true;
	global.fetching = false;

	return global.cachedLyrics.lyrics;
};
