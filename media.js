const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

global.noLyrics = JSON.stringify({
	text: "No Lyrics Avaible",
	alt: "none",
	class: "paused",
	tooltip: "none",
});

global.noSong = JSON.stringify({
	text: "No Song Playing",
	alt: "none",
	class: "paused",
	tooltip: "none",
});

global.noMedia = JSON.stringify({
	text: "No Media Playing",
	alt: "none",
	class: "none",
	tooltip: "none",
});

global.logLevels = {
	debug: 4,
	error: 3,
	warn: 2,
	info: 1,
	none: 0,
};

global.configFolder =
	process.env.CONFIG_FOLDER ||
	path.join(process.env.HOME, ".config", "syncLyrics");

if (configFolder.startsWith("./")) {
	outputLog("\x1b[31mConfig folder must be an absolute path");

	process.exit(0);
}

global.configFile = path.join(configFolder, "config.json");

global.config = {
	logLevel: "none",

	tooltipSourceIncludeCachedNotice: true,
	tooltipMetadataDividerColor: '#ffffff',
	tooltipMetadataArtistColor: "#ffffff",
	tooltipMetadataTrackColor: "#ffffff",
	tooltipMetadataAlbumColor: "#ffffff",
	tooltipCurrentLyricColor: "#cba6f7",
	tooltipPlayerSourceColor: "#89b4fa",
	tooltipIncludeSongMetadata: true,
	tooltipMetadataDivider: "-",

	deleteIconWhenPaused: true,
	iconPath: null,

	ignoredPlayers: ["plasma-browser-integration"],
	favoritePlayers: ["spotify"],
	hatedPlayers: ["chromium"],
	sourceOrder: ["musixmatch", "lrclib"],

	dataUpdateInterval: 1000,
	artistUpdateInterval: 1000,
	nameUpdateInterval: 1000,
	lyricsUpdateInterval: 500,

	marqueeMinLength: 20,
	marqueeDivider: "  ",

	defaultVolumeStep: 5,
};

const functionsDir = path.join(__dirname, "functions");

const functionFiles = fs
	.readdirSync(functionsDir)
	.filter((file) => file.endsWith(".js"));

for (const functionFile of functionFiles) {
	const functionPath = path.join(functionsDir, functionFile);

	const functionData = require(functionPath);
	const functionName = functionFile.split(".").shift();

	global[functionName] = functionData;
}

global.global.currentIntervalType;
global.fetchingMxmToken = false;
global.currentMarqueeIndex = 0;
global.global.fetchingTrackId;
global.lyricsCached = false;
global.lastStoppedPlayer;
global.playerOffset = 0;
global.fetching = false;
global.currentInterval;
global.fetchingSource;
global.currentTrackId;
global.cachedLyrics;
global.lyricsSource;

if (!fs.existsSync(configFolder))
	fs.mkdirSync(configFolder, {
		recursive: true,
	});

updateConfig();

infoLog("Using config:", config);

infoLog(`Loaded config from the file ${configFile}`);

fs.watchFile(configFile, () => {
	infoLog("Config file has been updated. Updating config...");

	updateConfig();

	infoLog("Using config:", config);
});

infoLog(`Using config folder: ${configFolder}`);

if (["--show-lyrics", "-sl"].some((arg) => process.argv.includes(arg))) {
	(async () => {
		const metadata = fetchPlayerctl();

		if (!metadata) process.exit(0);

		const lyrics = await getLyrics(metadata);

		if (!lyrics) {
			infoLog("This song has no lyrics");

			process.exit(0);
		}

		if (["--save", "-s"].some((arg) => process.argv.includes(arg))) {
			const downloadFolder = path.join(
				process.env.HOME,
				"Downloads",
				"syncLyric",
			);

			if (!fs.existsSync(downloadFolder))
				fs.mkdirSync(downloadFolder, {
					recursive: true,
				});

			const fileName = `${metadata.track.replaceAll(" ", "_")}-${metadata.artist.replaceAll(" ", "_")}.txt`;

			const filePath = path.join(downloadFolder, fileName);

			fs.writeFileSync(filePath, lyrics.replaceAll("\\n", "\n"));

			execSync(`xdg-open ${filePath}`);

			process.exit(0);
		}

		const tmpFilePath = path.join("/", "tmp", "lyrics.txt");

		fs.writeFileSync(tmpFilePath, lyrics.replaceAll("\\n", "\n"));

		execSync(`xdg-open ${tmpFilePath}`);

		process.exit(0);
	})();
}

if (["--play-toggle", "-pt"].some((arg) => process.argv.includes(arg))) {
	const player = getPlayer(false);

	if (!player && !global.lastStoppedPlayer) process.exit(0);

	execSync(`playerctl -p ${global.lastStoppedPlayer || player} play-pause`);

	global.lastStoppedPlayer = player;

	process.exit(0);
}

if (["--show-cover", "-sc"].some((arg) => process.argv.includes(arg))) {
	const iconPath = config.iconPath || path.join(configFolder, "icon.png");

	if (!fs.existsSync(iconPath)) process.exit(0);

	if (["--save", "-s"].some((arg) => process.argv.includes(arg))) {
		const metadata = fetchPlayerctl();

		if (!metadata) process.exit(0);

		const downloadFolder = path.join(
			process.env.HOME,
			"Downloads",
			"syncLyric",
		);

		if (!fs.existsSync(downloadFolder))
			fs.mkdirSync(downloadFolder, {
				recursive: true,
			});

		const fileName = `${metadata.track.replaceAll(" ", "_")}-${metadata.artist.replaceAll(" ", "_")}.png`;

		const filePath = path.join(downloadFolder, fileName);

		fs.copyFileSync(iconPath, filePath);

		execSync(`xdg-open ${filePath}`);

		process.exit(0);
	}

	execSync(`xdg-open ${iconPath}`);

	process.exit(0);
}

if (["--trackid", "-tid"].some((arg) => process.argv.includes(arg))) {
	const metadata = fetchPlayerctl();

	if (!metadata) process.exit(0);

	const trackId = metadata.trackId.split("/").pop();

	infoLog(`Current track ID is: ${trackId}`);

	process.exit(0);
}

if (["--artist", "-a"].some((arg) => process.argv.includes(arg))) {
	if (!global.currentInterval) {
		global.global.currentIntervalType = "artist";

		global.currentInterval = setInterval(
			returnArtist,
			config.artistUpdateInterval || 1000,
		);
	}
}

if (["--cover", "-c"].some((arg) => process.argv.includes(arg))) {
	const player = getPlayer(false);

	if (!player) {
		outputLog();

		process.exit(0);
	}

	if (config.deleteIconWhenPaused) {
		const metadata = fetchPlayerctl(player, false, false);

		if (!metadata.playing) {
			outputLog();

			process.exit(0);
		}
	}

	outputLog(config.iconPath || path.join(configFolder, "icon.png"));

	process.exit(0);
}

if (["--data", "-d"].some((arg) => process.argv.includes(arg))) {
	if (!global.currentInterval) {
		global.global.currentIntervalType = "data";

		global.currentInterval = setInterval(
			returnData,
			config.dataUpdateInterval || 1000,
		);
	}
}

if (["--name", "-n"].some((arg) => process.argv.includes(arg))) {
	if (!global.currentInterval) {
		global.global.currentIntervalType = "name";

		global.currentInterval = setInterval(
			returnName,
			config.nameUpdateInterval || 1000,
		);
	}
}

const volumeDownArg = process.argv.find((processArg) =>
	["--volume-down", "-vol-"].some((arg) => processArg.startsWith(arg)),
);

if (volumeDownArg) {
	const player = getPlayer();

	if (!player && !global.lastStoppedPlayer) process.exit(0);

	const stepAmount =
		Number.parseInt(volumeDownArg.split("=").pop()) || config.defaultVolumeStep;

	const step = stepAmount * 0.01;

	execSync(
		`playerctl -p ${global.lastStoppedPlayer || player} volume ${step}-`,
	);

	global.lastStoppedPlayer = player;

	process.exit(0);
}

const volumeUpArg = process.argv.find((processArg) =>
	["--volume-up", "-vol+"].some((arg) => processArg.startsWith(arg)),
);

if (volumeUpArg) {
	const player = getPlayer();

	if (!player && !global.lastStoppedPlayer) process.exit(0);

	const stepAmount =
		Number.parseInt(volumeUpArg.split("=").pop()) || config.defaultVolumeStep;

	const step = stepAmount * 0.01;

	execSync(
		`playerctl -p ${global.lastStoppedPlayer || player} volume ${step}+`,
	);

	global.lastStoppedPlayer = player;

	process.exit(0);
}

if (!global.currentInterval) {
	global.global.currentIntervalType = "lyrics";

	global.currentInterval = setInterval(
		returnLyrics,
		config.lyricsUpdateInterval || 500,
	);
}
