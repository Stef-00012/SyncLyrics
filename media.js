const { SyncLyrics, sources, logLevels } = require("@stef-0012/synclyrics");
const { execSync } = require("node:child_process");
const path = require("node:path");
const fs = require("node:fs");

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

global.logLevels = logLevels;
global.avaibleSources = sources;

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
	tooltipMetadataDividerColor: "#ffffff",
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

	instrumentalLyricIndicator: " ",
	artistLyricsUpdateInterval: 500,
	dataLyricsUpdateInterval: 500,
	nameLyricsUpdateInterval: 500,
	artistUpdateInterval: 1000,
	lyricsUpdateInterval: 500,
	dataUpdateInterval: 1000,
	nameUpdateInterval: 1000,

	dataLyricsDivider: " | ",

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

global.LyricsManager = new SyncLyrics({
	instrumentalLyricsIndicator: config.instrumentalLyricIndicator,
	sources: config.sourceOrder,
	logLevel: config.logLevel,
	saveMusixmatchToken: (tokenData) => {
		const tokenFile = path.join(global.configFolder, "musixmatchToken.json");

		fs.writeFileSync(tokenFile, JSON.stringify(tokenData, null, 4));
	},
	getMusixmatchToken: () => {
		const tokenFile = path.join(global.configFolder, "musixmatchToken.json");

		if (!fs.existsSync(tokenFile)) return null;

		const tokenFileContent = fs.readFileSync(tokenFile, "utf-8");

		try {
			const tokenData = JSON.parse(tokenFileContent);

			return tokenData;
		} catch (e) {
			return null;
		}
	},
});

global.warnLog = LyricsManager.warnLog;
global.infoLog = LyricsManager.infoLog;
global.errorLog = LyricsManager.errorLog;
global.debugLog = LyricsManager.debugLog;

global.currentMarqueeIndex = 0;
global.fetchingIcon = false;
global.playerOffset = 0;

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

if (["--help", "-h"].some((arg) => process.argv.includes(arg))) {
	outputLog(`\x1b[31;1mIMPORTANT: Requires playerctl

\x1b[32mUsage: synclyrics [-flags]

\x1b[0mFlags:
\x1b[33m--artist-lyrics \x1b[0m| \x1b[33m-al     \x1b[0m: Returns song's artist & lyrics together.
\x1b[33m--volume-down=X \x1b[0m| \x1b[33m-vol-=X \x1b[0m: Decreases the volume by X%.
\x1b[33m--volume-up=X   \x1b[0m| \x1b[33m-vol+=X \x1b[0m: Increases the volume by X%.
\x1b[33m--play-toggle   \x1b[0m| \x1b[33m-pt     \x1b[0m: Toggle player's play-pause state.
\x1b[33m--show-lyrics   \x1b[0m| \x1b[33m-sl     \x1b[0m: Saves song's plain lyrics in a file (/tmp/lyrics, saves in ~/Downloads/SyncLyrics/<song>.txt when ran with --save or -s - Saves song's synced lyrics when used with --synced or -sy).
\x1b[33m--data-lyrics   \x1b[0m| \x1b[33m-dl     \x1b[0m: Returns song's artist, name & lyrics together.
\x1b[33m--name-lyrics   \x1b[0m| \x1b[33m-nl     \x1b[0m: Returns song's name & lyrics together.
\x1b[33m--show-cover    \x1b[0m| \x1b[33m-sc     \x1b[0m: Saves song's icon in a file ($CONFIG_FOLDER/icon.png, saves in ~/Downloads/SyncLyrics/<song>.txt when ran with --save or -s).
\x1b[33m--trackid       \x1b[0m| \x1b[33m-tid    \x1b[0m: Returns song's ID.
\x1b[33m--artist        \x1b[0m| \x1b[33m-a      \x1b[0m: Returns song's artist.
\x1b[33m--cover         \x1b[0m| \x1b[33m-c      \x1b[0m: Returns an absolute path to the song's icon.
\x1b[33m--data          \x1b[0m| \x1b[33m-d      \x1b[0m: Returns song's artist & name together.
\x1b[33m--name          \x1b[0m| \x1b[33m-n      \x1b[0m: Returns song's name.

Envs:
\x1b[33mCONFIG_FOLDER \x1b[0m: Sets the config folder path
	\x1b[34mExample: CONFIG_FOLDER=/path/to/config synclyrics [-flags]`);

	process.exit(0);
}

(async () => {
	if (["--show-lyrics", "-sl"].some((arg) => process.argv.includes(arg))) {
		const metadata = await fetchPlayerctl();

		if (!metadata) process.exit(0);

		const lyricsType = ["--synced", "-sy"].some((arg) =>
			process.argv.includes(arg),
		)
			? "lineSynced"
			: "plain";

		console.log(lyricsType);

		const res = await LyricsManager.getLyrics({
			track: metadata.track,
			artist: metadata.artist,
			album: metadata.album,
			length: metadata.lengthMs,
			lyricsType: [lyricsType],
		});

		const lyrics = res.lyrics[lyricsType].lyrics;

		console.log(lyrics);

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

		if (!fs.existsSync(iconPath)) {
			warnLog("file doesn't exist");

			process.exit(0);
		}

		if (["--save", "-s"].some((arg) => process.argv.includes(arg))) {
			const metadata = await fetchPlayerctl();

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
		const metadata = await fetchPlayerctl();

		if (!metadata) process.exit(0);

		const trackId = metadata.trackId.split("/").pop();

		outputLog(`Current track ID is: ${trackId}`);

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
			const metadata = await fetchPlayerctl(player, false, false);

			if (!metadata || !metadata?.playing) {
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

	if (["--data-lyrics", "-dl"].some((arg) => process.argv.includes(arg))) {
		if (!global.currentInterval) {
			global.global.currentIntervalType = "data-lyrics";

			global.currentInterval = setInterval(
				returnDataLyrics,
				config.dataLyricsUpdateInterval || 500,
			);
		}
	}

	if (["--artist-lyrics", "-al"].some((arg) => process.argv.includes(arg))) {
		if (!global.currentInterval) {
			global.global.currentIntervalType = "artist-lyrics";

			global.currentInterval = setInterval(
				returnArtistLyrics,
				config.artistLyricsUpdateInterval || 500,
			);
		}
	}

	if (["--name-lyrics", "-nl"].some((arg) => process.argv.includes(arg))) {
		if (!global.currentInterval) {
			global.global.currentIntervalType = "name-lyrics";

			global.currentInterval = setInterval(
				returnNameLyrics,
				config.nameLyricsUpdateInterval || 500,
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
			Number.parseInt(volumeDownArg.split("=").pop()) ||
			config.defaultVolumeStep;

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
})();

if (!global.currentInterval) {
	global.global.currentIntervalType = "lyrics";

	global.currentInterval = setInterval(
		returnLyrics,
		config.lyricsUpdateInterval || 500,
	);
}
