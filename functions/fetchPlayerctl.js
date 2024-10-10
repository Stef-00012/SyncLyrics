const { execSync } = require("node:child_process");

module.exports = (player, skipPaused = true, retry = true) => {
	if (!player) player = getPlayer(skipPaused);
	const fullPlayer = getPlayer(false);

	if (!fullPlayer) {
		deleteIcon();

		return null;
	}

	if (!player) {
		if (global.config.deleteIconWhenPaused) deleteIcon();

		return null;
	}

	let rawMetadata;

	try {
		const args = [
			"artist",
			"album",
			"title",
			"mpris:trackid",
			"mpris:length / 1000",
			"mpris:artUrl",
			"status",
			"volume * 100",
			"position / 1000",
		]
			.map((arg) => `{{${arg}}}`)
			.join("||||");

		rawMetadata = execSync(`playerctl metadata -p ${player} --format "${args}"`)
			.toString()
			.trim()
			.split("||||");
	} catch (e) {
		errorLog(
			`Something went wrong while getting data from playerctl (player = ${player})`,
			e,
		);

		if (retry) {
			global.playerOffset++;

			const newPlayer = getPlayer(skipPaused, global.playerOffset);

			if (newPlayer) {
				infoLog(`Trying to use another player (${newPlayer})`);

				return fetchPlayerctl(newPlayer, skipPaused);
			}
		}

		global.playerOffset = 0;

		deleteIcon();

		if (
			["--artist", "--data", "--name", "-a", "-d", "-n"].some((arg) =>
				process.argv.includes(arg),
			)
		) {
			outputLog(noSong);

			return null;
		}

		outputLog(noLyrics);

		return null;
	}

	const metadata = {
		artist: rawMetadata[0],
		album: rawMetadata[1],
		track: rawMetadata[2],
		trackId: rawMetadata[3],
		lengthMs: Number.parseFloat(rawMetadata[4]),
		iconUrl: rawMetadata[5],
		playing: rawMetadata[6] === "Playing",
		volume: Math.round(rawMetadata[7]),
		currentMs: Number.parseFloat(rawMetadata[8]),
	};

	const metadataTrackId = metadata.trackId.split("/").pop();

	if (metadata.playing && global.currentTrackId !== metadataTrackId) {
		updateIcon(metadata);

		global.currentTrackId = metadataTrackId;
	}

	metadata.percentage = Math.round(
		(metadata.currentMs / metadata.lengthMs) * 100,
	);

	debugLog("Metadata:", metadata);

	global.playerOffset = 0;

	return metadata;
};
