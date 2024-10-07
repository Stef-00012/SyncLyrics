const fs = require("node:fs");

module.exports = (newConfig) => {
	if (!newConfig) newConfig = global.config;

	let invalidConfig = 0;

	if (typeof newConfig.debug !== "boolean") {
		debugLog("'config.debug' must be a boolean");

		invalidConfig++;

		newConfig.debug = false;
	}

	if (
		newConfig.dataUpdateInterval !== undefined &&
		newConfig.dataUpdateInterval !== null &&
		(!Number.isInteger(newConfig.dataUpdateInterval) ||
			newConfig.dataUpdateInterval <= 0)
	) {
		debugLog("'config.dataUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.dataUpdateInterval = 1000;
	}

	if (
		newConfig.dataUpdateInterval !== global.config.dataUpdateInterval &&
		global.global.currentIntervalType === "data"
	) {
		debugLog("Restarting the data interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnData,
			newConfig.dataUpdateInterval || 1000,
		);
	}

	if (
		newConfig.artistUpdateInterval !== undefined &&
		newConfig.artistUpdateInterval !== null &&
		(!Number.isInteger(newConfig.artistUpdateInterval) ||
			newConfig.artistUpdateInterval <= 0)
	) {
		debugLog("'config.artistUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.artistUpdateInterval = 1000;
	}

	if (
		newConfig.artistUpdateInterval !== global.config.artistUpdateInterval &&
		global.global.currentIntervalType === "artist"
	) {
		debugLog("Restarting the artist interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnArtist,
			newConfig.artistUpdateInterval || 1000,
		);
	}

	if (
		newConfig.nameUpdateInterval !== undefined &&
		newConfig.nameUpdateInterval !== null &&
		(!Number.isInteger(newConfig.nameUpdateInterval) ||
			newConfig.nameUpdateInterval <= 0)
	) {
		debugLog("'config.nameUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.nameUpdateInterval = 1000;
	}

	if (
		newConfig.nameUpdateInterval !== global.config.nameUpdateInterval &&
		global.global.currentIntervalType === "name"
	) {
		debugLog("Restarting the name interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnName,
			newConfig.nameUpdateInterval || 1000,
		);
	}

	if (
		newConfig.lyricsUpdateInterval !== undefined &&
		newConfig.lyricsUpdateInterval !== null &&
		(!Number.isInteger(newConfig.lyricsUpdateInterval) ||
			newConfig.lyricsUpdateInterval <= 0)
	) {
		debugLog("'config.lyricsUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.lyricsUpdateInterval = 500;
	}

	if (
		newConfig.lyricsUpdateInterval !== global.config.lyricsUpdateInterval &&
		global.global.currentIntervalType === "lyrics"
	) {
		debugLog("Restarting the lyrics interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnLyrics,
			newConfig.lyricsUpdateInterval || 1000,
		);
	}

	if (
		newConfig.marqueeMinLength !== undefined &&
		newConfig.marqueeMinLength !== null &&
		(!Number.isInteger(newConfig.marqueeMinLength) ||
			newConfig.marqueeMinLength <= 0)
	) {
		debugLog("'config.marqueeMinLength' must be a positive integer");

		invalidConfig++;

		newConfig.marqueeMinLength = 30;
	}

	if (config.marqueeMinLength !== newConfig.marqueeMinLength) {
		currentMarqueeIndex = 0;
	}

	const hexColorRegex = /^#(?:[0-9A-F]{3}){1,2}$/i;

	if (
		newConfig.tooltipCurrentLyricColor !== undefined &&
		newConfig.tooltipCurrentLyricColor !== null &&
		(typeof newConfig.tooltipCurrentLyricColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipCurrentLyricColor))
	) {
		debugLog(
			"'config.tooltipCurrentLyricColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.tooltipCurrentLyricColor = "#cba6f7";
	}

	if (
		newConfig.playerSourceColor !== undefined &&
		newConfig.playerSourceColor !== null &&
		(typeof newConfig.playerSourceColor !== "string" ||
			!hexColorRegex.test(newConfig.playerSourceColor))
	) {
		debugLog(
			"'config.playerSourceColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.playerSourceColor = "#89b4fa";
	}

	if (
		newConfig.ignoredPlayers !== undefined &&
		newConfig.ignoredPlayers !== null &&
		!Array.isArray(newConfig.ignoredPlayers)
	) {
		debugLog("'config.ignoredPlayers' must be an array");

		invalidConfig++;

		newConfig.ignoredPlayers = [];
	}

	if (!newConfig.ignoredPlayers.every((cfg) => typeof cfg === "string")) {
		debugLog("'config.ignoredPlayers' items must all be strings");

		invalidConfig++;

		newConfig.ignoredPlayers = newConfig.ignoredPlayers.filter(
			(cfg) => typeof cfg === "string",
		);
	}

	if (
		newConfig.favoritePlayers !== undefined &&
		newConfig.favoritePlayers !== null &&
		!Array.isArray(newConfig.favoritePlayers)
	) {
		debugLog("'config.favoritePlayers' must be an array");

		invalidConfig++;

		newConfig.favoritePlayers = [];
	}

	if (!newConfig.favoritePlayers.every((cfg) => typeof cfg === "string")) {
		debugLog("'config.favoritePlayers' items must all be strings");

		invalidConfig++;

		newConfig.favoritePlayers = newConfig.favoritePlayers.filter(
			(cfg) => typeof cfg === "string",
		);
	}

	if (
		newConfig.hatedPlayers !== undefined &&
		newConfig.hatedPlayers !== null &&
		!Array.isArray(newConfig.hatedPlayers)
	) {
		debugLog("'config.hatedPlayers' must be an array");

		invalidConfig++;

		newConfig.hatedPlayers = [];
	}

	if (!newConfig.hatedPlayers.every((cfg) => typeof cfg === "string")) {
		debugLog("'config.hatedPlayers' items must all be strings");

		invalidConfig++;

		newConfig.hatedPlayers = newConfig.hatedPlayers.filter(
			(cfg) => typeof cfg === "string",
		);
	}

	if (
		newConfig.iconPath !== undefined &&
		newConfig.iconPath !== null &&
		(typeof newConfig.iconPath !== "string" ||
			newConfig.iconPath.startsWith(".") ||
			!newConfig.iconPath.startsWith("/"))
	) {
		debugLog("'config.iconPath' must be a string and must be an absolute path");

		invalidConfig++;

		newConfig.iconPath = null;
	}

	if (newConfig.iconPath) {
		const pathSplit = newConfig.iconPath.split("/");

		pathSplit.pop();

		const dir = pathSplit.join("/");

		if (!fs.existsSync(dir)) {
			try {
				fs.mkdirSync(dir, {
					recursive: true,
				});
			} catch (e) {
				debugLog(
					"There was an error while creating the directory for the song icon",
				);

				invalidConfig++;

				newConfig.iconPath = null;
			}
		}
	}

	if (typeof newConfig.deleteIconWhenPaused !== "boolean") {
		debugLog("'config.deleteIconWhenPaused' must be a boolean");

		invalidConfig++;

		newConfig.deleteIconWhenPaused = false;
	}

	if (
		newConfig.defaultVolumeStep !== undefined &&
		newConfig.defaultVolumeStep !== null &&
		(!Number.isInteger(newConfig.defaultVolumeStep) ||
			newConfig.defaultVolumeStep <= 0 ||
			newConfig.defaultVolumeStep > 100)
	) {
		debugLog(
			"'config.defaultVolumeStep' must be a positive integer lesser than 100",
		);

		invalidConfig++;

		newConfig.defaultVolumeStep = 5;
	}

	if (!Array.isArray(newConfig.sourceOrder)) {
		debugLog("'config.sourceOrder' must be an array");

		invalidConfig++;

		newConfig.sourceOrder = ["musixmatch", "lrclib"];
	}

	if (!newConfig.sourceOrder.every((cfg) => typeof cfg === "string")) {
		debugLog("'config.sourceOrder' items must all be strings");

		invalidConfig++;

		newConfig.sourceOrder = newConfig.sourceOrder.filter(
			(cfg) => typeof cfg === "string",
		);
	}

	if (typeof newConfig.tooltipIncludeSongMetadata !== "boolean") {
		debugLog("'config.tooltipIncludeSongMetadata' must be a boolean");

		invalidConfig++;

		newConfig.tooltipIncludeSongMetadata = false;
	}

	if (
		newConfig.tooltipMetadataDivider !== undefined &&
		newConfig.tooltipMetadataDivider !== null &&
		(typeof newConfig.tooltipMetadataDivider !== "string" ||
			newConfig.tooltipMetadataDivider.length !== 1)
	) {
		debugLog(
			"'config.tooltipMetadataDivider' must be a string and must be 1 character long",
		);

		invalidConfig++;

		newConfig.tooltipMetadataDivider = "-";
	}

    if (typeof newConfig.tooltipSourceIncludeCachedNotice !== "boolean") {
		debugLog("'config.tooltipSourceIncludeCachedNotice' must be a boolean");

		invalidConfig++;

		newConfig.tooltipSourceIncludeCachedNotice = true;
	}

	if (invalidConfig > 0) {
		try {
			fs.writeFileSync(global.configFile, JSON.stringify(newConfig, null, 4));
		} catch (e) {
			debugLog("Something went wrong while updating the config file...", e);
		}

		return false;
	}

	return true;
};