const fs = require("node:fs");

module.exports = (newConfig) => {
	if (!newConfig) newConfig = global.config;

	let invalidConfig = 0;

	if (
		newConfig.logLevel !== undefined &&
		newConfig.logLevel !== null &&
		(typeof newConfig.logLevel !== "string" ||
			!Object.keys(logLevels).includes(newConfig.logLevel))
	) {
		warnLog(
			"'config.logLevel' must be a string and must be one of",
			Object.keys(logLevels),
		);

		invalidConfig++;

		newConfig.logLevel = "none";
	}

	if (typeof newConfig.tooltipSourceIncludeCachedNotice !== "boolean") {
		warnLog("'config.tooltipSourceIncludeCachedNotice' must be a boolean");

		invalidConfig++;

		newConfig.tooltipSourceIncludeCachedNotice = true;
	}

	const hexColorRegex = /^#(?:[0-9A-F]{3}){1,2}$/i;

	if (
		newConfig.tooltipMetadataDividerColor !== undefined &&
		newConfig.tooltipMetadataDividerColor !== null &&
		(typeof newConfig.tooltipMetadataDividerColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipMetadataDividerColor))
	) {
		warnLog(
			"'config.tooltipMetadataDividerColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.tooltipMetadataDividerColor = "#89b4fa";
	}

	if (
		newConfig.tooltipMetadataArtistColor !== undefined &&
		newConfig.tooltipMetadataArtistColor !== null &&
		(typeof newConfig.tooltipMetadataArtistColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipMetadataArtistColor))
	) {
		warnLog(
			"'config.tooltipMetadataArtistColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.tooltipMetadataArtistColor = "#ffffff";
	}

	if (
		newConfig.tooltipMetadataTrackColor !== undefined &&
		newConfig.tooltipMetadataTrackColor !== null &&
		(typeof newConfig.tooltipMetadataTrackColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipMetadataTrackColor))
	) {
		warnLog(
			"'config.tooltipMetadataTrackColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.tooltipMetadataTrackColor = "#ffffff";
	}

	if (
		newConfig.tooltipMetadataAlbumColor !== undefined &&
		newConfig.tooltipMetadataAlbumColor !== null &&
		(typeof newConfig.tooltipMetadataAlbumColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipMetadataAlbumColor))
	) {
		warnLog(
			"'config.tooltipMetadataAlbumColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.tooltipMetadataAlbumColor = "#ffffff";
	}

	if (
		newConfig.tooltipCurrentLyricColor !== undefined &&
		newConfig.tooltipCurrentLyricColor !== null &&
		(typeof newConfig.tooltipCurrentLyricColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipCurrentLyricColor))
	) {
		warnLog(
			"'config.tooltipCurrentLyricColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.tooltipCurrentLyricColor = "#cba6f7";
	}

	if (
		newConfig.tooltipPlayerSourceColor !== undefined &&
		newConfig.tooltipPlayerSourceColor !== null &&
		(typeof newConfig.tooltipPlayerSourceColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipPlayerSourceColor))
	) {
		warnLog(
			"'config.tooltipPlayerSourceColor' must be a string and must be a valid HEX color",
		);

		invalidConfig++;

		newConfig.tooltipPlayerSourceColor = "#89b4fa";
	}

	if (typeof newConfig.tooltipIncludeSongMetadata !== "boolean") {
		warnLog("'config.tooltipIncludeSongMetadata' must be a boolean");

		invalidConfig++;

		newConfig.tooltipIncludeSongMetadata = false;
	}

	if (
		newConfig.tooltipMetadataDivider !== undefined &&
		newConfig.tooltipMetadataDivider !== null &&
		(typeof newConfig.tooltipMetadataDivider !== "string" ||
			newConfig.tooltipMetadataDivider.length !== 1)
	) {
		warnLog(
			"'config.tooltipMetadataDivider' must be a string and must be 1 character long",
		);

		invalidConfig++;

		newConfig.tooltipMetadataDivider = "-";
	}

	if (typeof newConfig.deleteIconWhenPaused !== "boolean") {
		warnLog("'config.deleteIconWhenPaused' must be a boolean");

		invalidConfig++;

		newConfig.deleteIconWhenPaused = false;
	}

	if (
		newConfig.iconPath !== undefined &&
		newConfig.iconPath !== null &&
		(typeof newConfig.iconPath !== "string" ||
			newConfig.iconPath.startsWith(".") ||
			!newConfig.iconPath.startsWith("/"))
	) {
		warnLog("'config.iconPath' must be a string and must be an absolute path");

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
				errorLog(
					"There was an error while creating the directory for the song icon",
					e,
				);

				invalidConfig++;

				newConfig.iconPath = null;
			}
		}
	}

	if (
		newConfig.ignoredPlayers !== undefined &&
		newConfig.ignoredPlayers !== null &&
		!Array.isArray(newConfig.ignoredPlayers)
	) {
		warnLog("'config.ignoredPlayers' must be an array");

		invalidConfig++;

		newConfig.ignoredPlayers = [];
	}

	if (!newConfig.ignoredPlayers.every((cfg) => typeof cfg === "string")) {
		warnLog("'config.ignoredPlayers' items must all be strings");

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
		warnLog("'config.favoritePlayers' must be an array");

		invalidConfig++;

		newConfig.favoritePlayers = [];
	}

	if (!newConfig.favoritePlayers.every((cfg) => typeof cfg === "string")) {
		warnLog("'config.favoritePlayers' items must all be strings");

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
		warnLog("'config.hatedPlayers' must be an array");

		invalidConfig++;

		newConfig.hatedPlayers = [];
	}

	if (!newConfig.hatedPlayers.every((cfg) => typeof cfg === "string")) {
		warnLog("'config.hatedPlayers' items must all be strings");

		invalidConfig++;

		newConfig.hatedPlayers = newConfig.hatedPlayers.filter(
			(cfg) => typeof cfg === "string",
		);
	}

	if (!Array.isArray(newConfig.sourceOrder)) {
		warnLog("'config.sourceOrder' must be an array");

		invalidConfig++;

		newConfig.sourceOrder = ["musixmatch", "lrclib", "netease"];
	}

	if (!newConfig.sourceOrder.every((cfg) => typeof cfg === "string")) {
		warnLog("'config.sourceOrder' items must all be strings");

		invalidConfig++;

		newConfig.sourceOrder = newConfig.sourceOrder.filter(
			(cfg) => typeof cfg === "string",
		);
	}

	if (
		newConfig.instrumentalLyricIndicator !== undefined &&
		newConfig.instrumentalLyricIndicator !== null &&
		typeof newConfig.instrumentalLyricIndicator !== "string"
	) {
		warnLog("'config.instrumentalLyricIndicator' must be a string");

		invalidConfig++;

		newConfig.instrumentalLyricIndicator = " ";
	}

	if (
		newConfig.artistUpdateInterval !== undefined &&
		newConfig.artistUpdateInterval !== null &&
		(!Number.isInteger(newConfig.artistUpdateInterval) ||
			newConfig.artistUpdateInterval <= 0)
	) {
		warnLog("'config.artistUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.artistUpdateInterval = 1000;
	}

	if (
		newConfig.artistUpdateInterval !== global.config.artistUpdateInterval &&
		global.global.currentIntervalType === "artist"
	) {
		infoLog("Restarting the artist interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnArtist,
			newConfig.artistUpdateInterval || 1000,
		);
	}

	if (
		newConfig.lyricsUpdateInterval !== undefined &&
		newConfig.lyricsUpdateInterval !== null &&
		(!Number.isInteger(newConfig.lyricsUpdateInterval) ||
			newConfig.lyricsUpdateInterval <= 0)
	) {
		warnLog("'config.lyricsUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.lyricsUpdateInterval = 500;
	}

	if (
		newConfig.lyricsUpdateInterval !== global.config.lyricsUpdateInterval &&
		global.global.currentIntervalType === "lyrics"
	) {
		infoLog("Restarting the lyrics interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnLyrics,
			newConfig.lyricsUpdateInterval || 1000,
		);
	}

	if (
		newConfig.dataUpdateInterval !== undefined &&
		newConfig.dataUpdateInterval !== null &&
		(!Number.isInteger(newConfig.dataUpdateInterval) ||
			newConfig.dataUpdateInterval <= 0)
	) {
		warnLog("'config.dataUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.dataUpdateInterval = 1000;
	}

	if (
		newConfig.dataUpdateInterval !== global.config.dataUpdateInterval &&
		global.global.currentIntervalType === "data"
	) {
		infoLog("Restarting the data interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnData,
			newConfig.dataUpdateInterval || 1000,
		);
	}

	if (
		newConfig.nameUpdateInterval !== undefined &&
		newConfig.nameUpdateInterval !== null &&
		(!Number.isInteger(newConfig.nameUpdateInterval) ||
			newConfig.nameUpdateInterval <= 0)
	) {
		warnLog("'config.nameUpdateInterval' must be a positive integer");

		invalidConfig++;

		newConfig.nameUpdateInterval = 1000;
	}

	if (
		newConfig.nameUpdateInterval !== global.config.nameUpdateInterval &&
		global.global.currentIntervalType === "name"
	) {
		infoLog("Restarting the name interval");

		clearInterval(global.currentInterval);

		global.currentInterval = setInterval(
			returnName,
			newConfig.nameUpdateInterval || 1000,
		);
	}

	if (
		newConfig.marqueeMinLength !== undefined &&
		newConfig.marqueeMinLength !== null &&
		(!Number.isInteger(newConfig.marqueeMinLength) ||
			newConfig.marqueeMinLength <= 0)
	) {
		warnLog("'config.marqueeMinLength' must be a positive integer");

		invalidConfig++;

		newConfig.marqueeMinLength = 30;
	}

	if (config.marqueeMinLength !== newConfig.marqueeMinLength) {
		currentMarqueeIndex = 0;
	}

	if (
		newConfig.marqueeDivider !== undefined &&
		newConfig.marqueeDivider !== null &&
		typeof newConfig.marqueeDivider !== "string"
	) {
		warnLog("'config.marqueeDivider' must be a string");

		invalidConfig++;

		newConfig.marqueeDivider = "  ";
	}

	if (
		newConfig.defaultVolumeStep !== undefined &&
		newConfig.defaultVolumeStep !== null &&
		(!Number.isInteger(newConfig.defaultVolumeStep) ||
			newConfig.defaultVolumeStep <= 0 ||
			newConfig.defaultVolumeStep > 100)
	) {
		warnLog(
			"'config.defaultVolumeStep' must be a positive integer lesser than 100",
		);

		invalidConfig++;

		newConfig.defaultVolumeStep = 5;
	}

	if (invalidConfig > 0) {
		try {
			fs.writeFileSync(global.configFile, JSON.stringify(newConfig, null, 4));
		} catch (e) {
			errorLog("Something went wrong while updating the config file...", e);
		}

		return false;
	}

	return true;
};
