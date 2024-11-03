const path = require("node:path");
const fs = require("node:fs");

module.exports = async (metadata) => {
	const trackId = metadata.trackId.split("/").pop();

	const localLyricsFile = path.join(configFolder, "lyrics", `${trackId}.txt`);

	if (fs.existsSync(localLyricsFile)) {
		infoLog("Loading lyrics from local file");

		if (trackId === global.localLyricsId && global.localLyrics) return {
			source: "Local File",
			lyrics: global.localLyrics,
			cached: true
		}

		const lyrics = fs.readFileSync(localLyricsFile, "utf-8");

		if (lyrics.length > 0 && lyrics.startsWith("[")) {
			global.localLyricsId = trackId;
			global.localLyrics = LyricsManager.parseLyrics(lyrics)

			return {
				source: "Local File",
				lyrics: LyricsManager.parseLyrics(lyrics),
				cached: false
			};
		}
	}

	const res = await LyricsManager.getLyrics({
		track: metadata.track,
		artist: metadata.artist,
		album: metadata.album,
		length: metadata.lengthMs,
		lyricsType: ["lineSynced"]
	})

	const lyrics = res.lyrics.lineSynced.parse()

	return {
		source: res.lyrics.lineSynced.source,
		lyrics,
		cached: res.cached
	}
};
