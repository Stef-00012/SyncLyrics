const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

const noLyrics = JSON.stringify({
	text: "No Lyrics Avaible",
	alt: "none",
	class: "paused",
	tooltip: "none",
});

const noSong = JSON.stringify({
	text: "No Song Playing",
	alt: "none",
	class: "paused",
	tooltip: "none",
});

const noMedia = JSON.stringify({
	text: "No Media Playing",
	alt: "none",
	class: "none",
	tooltip: "none",
});

const configFolder =
	process.env.CONFIG_FOLDER ||
	path.join(process.env.HOME, ".config", "syncLyrics");

if (configFolder.startsWith("./")) {
	outputLog("\x1b[31mConfig folder must be an absolute path");

	process.exit(0);
}

const configFile = path.join(configFolder, "config.json");

let config = {
	debug: false,
	dataUpdateInterval: 1000,
	artistUpdateInterval: 1000,
	nameUpdateInterval: 1000,
	lyricsUpdateInterval: 500,
	marqueeMinLength: 30,
	tooltipCurrentLyricColor: "#cba6f7",
	playerSourceColor: "#89b4fa",
	ignoredPlayers: [],
	favoritePlayers: [],
	hatedPlayers: [],
	iconPath: null,
	deleteIconWhenPaused: false,
	defaultVolumeStep: 5,
	musixmatch: {
		usertoken: null,
		cookies: null,
	},
	sourceOrder: ["musixmatch", "lrclib"],
};

let lyricsSource;
let cachedLyrics;
let currentTrackId;
let currentInterval;
let playerOffset = 0;
let lastStoppedPlayer;
let currentIntervalType;
let currentMarqueeIndex = 0;

if (!fs.existsSync(configFolder))
	fs.mkdirSync(configFolder, {
		recursive: true,
	});

updateConfig();

debugLog("Using config:", config);

debugLog(`Loaded config from the file ${configFile}`);

fs.watchFile(configFile, () => {
	debugLog("Config file has been updated. Updating config...");

	updateConfig();

	debugLog("Using config:", config);
});

debugLog(`Using config folder: ${configFolder}`);

if (["--show-lyrics", "-sl"].some((arg) => process.argv.includes(arg))) {
	(async () => {
		const metadata = fetchPlayerctl();

		if (!metadata) process.exit(0);

		const lyrics = await getLyrics(metadata);

		if (!lyrics) {
			debugLog("This song has no lyrics");

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

if (["--play-toggle", "-pt"].some((arg) => process.argv.includes(arg))) {
	const player = getPlayer(false);

	if (!player && !lastStoppedPlayer) process.exit(0);

	execSync(`playerctl -p ${lastStoppedPlayer || player} play-pause`);

	lastStoppedPlayer = player;

	process.exit(0);
}

if (["--trackid", "-tid"].some((arg) => process.argv.includes(arg))) {
	const metadata = fetchPlayerctl();

	if (!metadata) process.exit(0);

	const trackId = metadata.trackId.split("/").pop();

	outputLog(`Current track ID is: ${trackId}`);

	process.exit(0);
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

if (["--artist", "-a"].some((arg) => process.argv.includes(arg))) {
	if (!currentInterval) {
		currentIntervalType = "artist";

		currentInterval = setInterval(
			returnArtist,
			config.artistUpdateInterval || 1000,
		);
	}
}

if (["--data", "-d"].some((arg) => process.argv.includes(arg))) {
	if (!currentInterval) {
		currentIntervalType = "data";

		currentInterval = setInterval(
			returnData,
			config.dataUpdateInterval || 1000,
		);
	}
}

if (["--name", "-n"].some((arg) => process.argv.includes(arg))) {
	if (!currentInterval) {
		currentIntervalType = "name";

		currentInterval = setInterval(
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

	if (!player && !lastStoppedPlayer) process.exit(0);

	const stepAmount =
		Number.parseInt(volumeDownArg.split("=").pop()) || config.defaultVolumeStep;

	const step = stepAmount * 0.01;

	execSync(`playerctl -p ${lastStoppedPlayer || player} volume ${step}-`);

	lastStoppedPlayer = player;

	process.exit(0);
}

const volumeUpArg = process.argv.find((processArg) =>
	["--volume-up", "-vol+"].some((arg) => processArg.startsWith(arg)),
);

if (volumeUpArg) {
	const player = getPlayer();

	if (!player && !lastStoppedPlayer) process.exit(0);

	const stepAmount =
		Number.parseInt(volumeUpArg.split("=").pop()) || config.defaultVolumeStep;

	const step = stepAmount * 0.01;

	execSync(`playerctl -p ${lastStoppedPlayer || player} volume ${step}+`);

	lastStoppedPlayer = player;

	process.exit(0);
}

if (!currentInterval) {
	currentIntervalType = "lyrics";

	currentInterval = setInterval(
		returnLyrics,
		config.lyricsUpdateInterval || 500,
	);
}

async function fetchLyricsMusixmatch(metadata) {
	if (!metadata) return;
	if (!config.musixmatch?.usertoken || !config.musixmatch?.cookies) return;

	debugLog(
		`Fetching the lyrics for "${metadata.track}" from "${metadata.album}" from "${metadata.artist}" (${metadata.trackId}) [Musixmatch]`,
	);

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const rootUrl = "https://apic-desktop.musixmatch.com//ws/1.1";

	const defaultSearchParams = new URLSearchParams({
		app_id: "web-desktop-app-v1.0",
		usertoken: config.musixmatch?.usertoken,
	});

	const searchUrl = `${rootUrl}/track.search?${defaultSearchParams}`;
	const lyricsUrl = `${rootUrl}/track.subtitle.get?${defaultSearchParams}`;

	const searchSearchParams = new URLSearchParams({
		q_track: metadata.track,
		q_artist: metadata.artist,
		q_album: metadata.album,
		page_size: 20,
		page: 1,
		f_has_subtitles: 1,
	});

	let commonTrackId;

	try {
		const res = await fetch(`${searchUrl}&${searchSearchParams}`, {
			headers: {
				cookie: config.musixmatch?.cookies,
			},
		});

		if (!res.ok) {
			debugLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [Musixmatch - Search]`,
			);

			cachedLyrics = cacheData;

			return null;
		}

		const data = await res.json();

		const track = data?.message?.body?.track_list?.find(
			(listItem) =>
				listItem.track.track_name === metadata.track &&
				listItem.track.artist_name === metadata.artist,
		);

		commonTrackId = track.track.commontrack_id;
	} catch (e) {
		cachedLyrics = cacheData;

		debugLog(
			"Something went wrong while fetching the lyrics [Musixmatch - Search]",
		);

		return null;
	}

	if (!commonTrackId) {
		debugLog("Missing commontrack_id [Musixmatch - Search]");

		cachedLyrics = cacheData;

		return null;
	}

	const lyricsSearchParams = new URLSearchParams({
		commontrack_id: commonTrackId,
	});

	try {
		const res = await fetch(`${lyricsUrl}&${lyricsSearchParams}`, {
			headers: {
				cookie: config.musixmatch?.cookies,
			},
		});

		if (!res.ok) {
			debugLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [Musixmatch - Lyrics]`,
			);

			cachedLyrics = cacheData;

			return null;
		}

		const data = await res.json();

		const lyrics = data?.message?.body?.subtitle?.subtitle_body;

		if (!lyrics) {
			debugLog("Missing Lyrics [Musixmatch - Lyrics]");

			cachedLyrics = cacheData;

			return null;
		}

		debugLog("Successfully fetched and cached the synced lyrics [LRCLIB]");

		cacheData.lyrics = lyrics;

		lyricsSource = "Musixmatch";

		cachedLyrics = cacheData;

		return lyrics;
	} catch (e) {
		cachedLyrics = cacheData;

		debugLog(
			"Something went wrong while fetching the lyrics [Musixmatch - Lyrics]",
		);

		return null;
	}
}

async function fetchLyricsLrcLib(metadata) {
	if (!metadata) return;

	debugLog(
		`Fetching the lyrics for "${metadata.track}" from "${metadata.album}" from "${metadata.artist}" (${metadata.trackId}) [LRCLIB]`,
	);

	const cacheData = {
		trackId: metadata.trackId,
		lyrics: null,
	};

	const searchParams = new URLSearchParams({
		track_name: metadata.track,
		artist_name: metadata.artist,
		album_name: metadata.album,
		q: metadata.track,
	});

	const url = `https://lrclib.net/api/search?${searchParams}`;

	try {
		const res = await fetch(url, {
			headers: {
				"Lrclib-Client":
					"SyncLyrics (https://github.com/Stef-00012/SyncLyrics)",
				"User-Agent": "SyncLyrics (https://github.com/Stef-00012/SyncLyrics)",
			},
		});

		if (!res.ok) {
			debugLog(
				`Lyrics fetch request failed with status ${res.status} (${res.statusText}) [LRCLIB]`,
			);

			cachedLyrics = cacheData;

			return null;
		}

		const data = await res.json();

		const match = data.find(
			(d) => d.artistName === metadata.artist && d.trackName === metadata.track,
		);

		if (!match || !match.syncedLyrics || match.syncedLyrics?.length <= 0) {
			debugLog("The fetched song does not have synced lyrics [LRCLIB]");

			cachedLyrics = cacheData;

			return null;
		}

		debugLog("Successfully fetched and cached the synced lyrics [LRCLIB]");

		cacheData.lyrics = match.syncedLyrics;

		cachedLyrics = cacheData;

		lyricsSource = "lrclib.net";

		return match.syncedLyrics;
	} catch (e) {
		cachedLyrics = cacheData;

		debugLog("Something went wrong while fetching the lyrics [LRCLIB]");

		return null;
	}
}

async function getLyrics(metadata) {
	const trackId = metadata.trackId.split("/").pop();

	const localLyricsFile = path.join(configFolder, "lyrics", `${trackId}.txt`);

	if (fs.existsSync(localLyricsFile)) {
		debugLog("Loading lyrics from local file");

		const lyrics = fs.readFileSync(localLyricsFile, "utf-8");

		if (lyrics.length > 0 && lyrics.startsWith("[")) {
			lyricsSource = "Local File";

			return lyrics;
		}
	}

	if (!cachedLyrics) {
		debugLog("No cached lyrics, fetching the song data");

		// return await fetchLyricsLrcLib(metadata);
		return await _getLyrics(metadata);
	}

	if (metadata.trackId !== cachedLyrics.trackId) {
		debugLog(
			"Cached song is different from current song, fetching the song data",
		);

		// return await fetchLyricsLrcLib(metadata);
		return await _getLyrics(metadata);
	}

	if (!cachedLyrics.lyrics) {
		debugLog("Cached lyrics are null");

		return null;
	}

	return cachedLyrics.lyrics;
}

async function _getLyrics(metadata) {
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

		const lyrics = await avaibleSources[source](metadata);

		if (lyrics) {
			debugLog(`Got lyrics from the source "${source}"`);

			return lyrics;
		}

		debugLog(`The source "${source}" doesn't have the lyrics`);
	}

	debugLog("None of the sources have the lyrics");

	return null;
}

async function returnArtist() {
	const metadata = fetchPlayerctl();

	if (!metadata) {
		debugLog("no media");

		return outputLog(noMedia);
	}

	if (!metadata.artist) {
		debugLog("Metadata doesn't include the artist name");

		return outputLog(noSong);
	}

	let tooltip;

	if (["--lyrics", "-l"].some((arg) => process.argv.includes(arg))) {
		const lyrics = await getLyrics(metadata);

		if (!lyrics) tooltip = "No Lyrics Avaible";
		else {
			const lyricsData = getLyricsData(metadata, lyrics);

			tooltip = formatLyricsTooltipText(lyricsData);
		}
	} else {
		tooltip = `Volume: ${metadata.volume}%`;
	}

	const data = marquee(`${metadata.artist}`);

	const output = JSON.stringify({
		text: escapeMarkup(data),
		alt: "playing",
		class: `perc${metadata.percentage}-0`,
		tooltip: tooltip,
	});

	outputLog(output);
}

async function returnLyrics() {
	const metadata = fetchPlayerctl();

	if (!metadata) return outputLog();

	const lyrics = await getLyrics(metadata);

	if (!lyrics) return outputLog(noLyrics);

	const lyricsData = getLyricsData(metadata, lyrics);
	const tooltip = formatLyricsTooltipText(lyricsData);

	const output = JSON.stringify({
		text: escapeMarkup(lyricsData.current),
		alt: "lyrics",
		class: "none",
		tooltip: tooltip,
	});

	outputLog(output);
}

async function returnName() {
	const metadata = fetchPlayerctl();

	if (!metadata) {
		debugLog("no media");

		return outputLog(noMedia);
	}

	if (!metadata.track) {
		debugLog("Metadata doesn't include the song name");

		return outputLog(noSong);
	}

	let tooltip;

	if (["--lyrics", "-l"].some((arg) => process.argv.includes(arg))) {
		const lyrics = await getLyrics(metadata);

		if (!lyrics) tooltip = "No Lyrics Avaible";
		else {
			const lyricsData = getLyricsData(metadata, lyrics);

			tooltip = formatLyricsTooltipText(lyricsData);
		}
	} else {
		tooltip = `Volume: ${metadata.volume}%`;
	}

	const data = marquee(`${metadata.track}`);

	const output = JSON.stringify({
		text: escapeMarkup(data),
		alt: "playing",
		class: `perc${metadata.percentage}-0`,
		tooltip: tooltip,
	});

	outputLog(output);
}

async function returnData() {
	const metadata = fetchPlayerctl();

	if (!metadata) {
		debugLog("no media");

		return outputLog(noMedia);
	}

	if (!metadata.track && !metadata.artist) {
		debugLog("Metadata doesn't include the song or artist name");

		return outputLog(noSong);
	}

	let tooltip;

	if (["--lyrics", "-l"].some((arg) => process.argv.includes(arg))) {
		const lyrics = await getLyrics(metadata);

		if (!lyrics) tooltip = "No Lyrics Avaible";
		else {
			const lyricsData = getLyricsData(metadata, lyrics);

			tooltip = formatLyricsTooltipText(lyricsData);
		}
	} else {
		tooltip = `Volume: ${metadata.volume}%`;
	}

	let text = "";
	if (metadata.artist) text = metadata.artist;
	if (metadata.track)
		text = text.length > 0 ? `${text} - ${metadata.track}` : metadata.track;

	const data = marquee(text);

	const output = JSON.stringify({
		text: escapeMarkup(data),
		alt: "playing",
		class: `perc${metadata.percentage}-0`,
		tooltip: tooltip,
	});

	outputLog(output);
}

function fetchPlayerctl(player, skipPaused = true, retry = true) {
	if (!player) player = getPlayer(skipPaused);
	const fullPlayer = getPlayer(false);

	if (!fullPlayer) {
		deleteIcon();

		return null;
	}

	if (!player) {
		if (config.deleteIconWhenPaused) deleteIcon();

		return null;
	}

	let rawMetadata;

	try {
		const args = [
			"artist",
			"album",
			"title",
			"mpris:trackid",
			"mpris:length",
			"mpris:artUrl",
			"status",
			"volume",
			"position",
		]
			.map((arg) => `{{${arg}}}`)
			.join("||||");

		rawMetadata = execSync(`playerctl metadata -p ${player} --format "${args}"`)
			.toString()
			.trim()
			.split("||||");
	} catch (e) {
		debugLog(
			`Something went wrong while getting data from playerctl (player = ${player})`,
		);

		if (retry) {
			playerOffset++;

			const newPlayer = getPlayer(skipPaused, playerOffset);

			if (newPlayer) {
				debugLog(`Trying to use another player (${newPlayer})`);

				return fetchPlayerctl(newPlayer, skipPaused);
			}
		}

		playerOffset = 0;

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
		lengthMs: Number.parseFloat(rawMetadata[4]) / 1000,
		iconUrl: rawMetadata[5],
		playing: rawMetadata[6] === "Playing",
		volume: Number.parseInt(rawMetadata[7] * 100),
		currentMs: Number.parseFloat(rawMetadata[8]) / 1000 + 1,
	};

	const metadataTrackId = metadata.trackId.split("/").pop();

	if (metadata.playing && currentTrackId !== metadataTrackId) {
		updateIcon(metadata);

		currentTrackId = metadataTrackId;
	}

	metadata.percentage = Math.round(
		(metadata.currentMs / metadata.lengthMs) * 100,
	);

	debugLog("Metadata:", metadata);

	playerOffset = 0;

	return metadata;
}

function getPlayer(skipPaused = true, offset = 0) {
	let players;

	try {
		players = execSync("playerctl --list-all").toString().trim();
	} catch (e) {
		debugLog("Something went wrong while getting the list of players");

		return null;
	}

	const playersList = players
		.split("\n")
		.map((player) => player.split(".").shift())
		.filter((player) => {
			if (config.ignoredPlayers?.includes(player)) return false;

			return true;
		})
		.sort((a, b) => {
			const aIsFavorite = config.favoritePlayers?.includes(a);
			const bIsFavorite = config.favoritePlayers?.includes(b);
			const aIsHated = config.hatedPlayers?.includes(a);
			const bIsHated = config.hatedPlayers?.includes(b);

			if (aIsFavorite && !bIsFavorite) return -1;
			if (!aIsFavorite && bIsFavorite) return 1;

			if (aIsHated && !bIsHated) return 1;
			if (!aIsHated && bIsHated) return -1;

			return 0;
		});

	debugLog("Avaible Players", playersList);

	if (playersList.length <= 0) return null;

	for (const player of playersList) {
		if (!skipPaused) {
			if (offset > 0) {
				offset--;

				continue;
			}

			return player;
		}

		try {
			const isPlaying =
				execSync(`playerctl -p ${player} status`).toString().trim() ===
				"Playing";

			if (!isPlaying) continue;
		} catch (e) {
			continue;
		}

		if (offset > 0) {
			offset--;

			continue;
		}

		return player;
	}

	return null;
}

function getLyricsData(metadata, lyrics) {
	let firstLyric;
	let lastLyric;

	let firstTimestamp;
	let lastTimestamp;

	const lyricsSplit = lyrics
		.split("\n")
		.map((lyric) => {
			let lyricText = lyric.split(" ");

			const time = lyricText.shift().replace(/[\[\]]/g, "");

			lyricText = escapeMarkup(lyricText.join(" "));

			if (lyricText.length > 0) return [time, lyricText];
		})
		.filter(Boolean);

	for (const lyric of lyricsSplit) {
		const timestamp = lyric[0];
		const text = lyric[1];

		if (!firstLyric) firstLyric = text;
		if (!firstTimestamp) firstTimestamp = timestamp;

		const minutes = timestamp.split(":")[0];
		const seconds = timestamp.split(":")[1];

		const totalSeconds =
			Number.parseFloat(minutes) * 60 + Number.parseFloat(seconds);

		if (metadata.currentMs / 1000 >= totalSeconds) {
			lastLyric = text;
			lastTimestamp = timestamp;
		}
	}

	const searchLyric = lastLyric || firstLyric;
	const searchTimestamp = lastTimestamp || firstTimestamp;

	if (!searchLyric) {
		debugLog("No lastLyric and firstLyric avaible");

		return null;
	}

	let previousLinesAmount = 0;
	let nextLinesAmount = 0;

	const currentLyricIndex = lyricsSplit.findIndex(
		(lyric) => lyric[0] === searchTimestamp && lyric[1] === searchLyric,
	);

	if (currentLyricIndex === 1) previousLinesAmount = 1;
	else if (currentLyricIndex === 2) previousLinesAmount = 2;
	else if (currentLyricIndex >= 3) previousLinesAmount = 3;

	if (currentLyricIndex === lyricsSplit.length - 1) nextLinesAmount = 1;
	else if (currentLyricIndex === lyricsSplit.length - 2) nextLinesAmount = 2;
	else if (currentLyricIndex <= lyricsSplit.length - 3) nextLinesAmount = 3;

	const previousLines = [...lyricsSplit]
		.splice(currentLyricIndex - previousLinesAmount, previousLinesAmount)
		.map((lyric) => lyric[1]);

	const nextLines = [...lyricsSplit]
		.splice(currentLyricIndex + 1, nextLinesAmount)
		.map((lyric) => lyric[1]);

	return {
		previous: previousLines,
		current: searchLyric,
		next: nextLines,
	};
}

function formatLyricsTooltipText(data) {
	const tooltipColor = config.tooltipCurrentLyricColor || "#cba6f7";

	const previousLyrics =
		data.previous.length > 0
			? `${escapeMarkup(data.previous.join("\n"))}\n`
			: "";

	const nextLyrics =
		data.next.length > 0 ? `\n${escapeMarkup(data.next.join("\n"))}` : "";

	const source = lyricsSource
		? `\n\n<span color="${config.playerSourceColor || "#89b4fa"}">[Source: ${lyricsSource}]</span>`
		: "";

	return `${previousLyrics}<span color="${tooltipColor}"><i>${escapeMarkup(data.current)}</i></span>${nextLyrics}${source}`;
}

function validateConfig(newConfig) {
	if (!newConfig) newConfig = config;

	let invalidConfig = 0;

	if (
		newConfig.debug !== undefined &&
		newConfig.debug !== null &&
		typeof newConfig.debug !== "boolean"
	) {
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
		newConfig.dataUpdateInterval !== config.dataUpdateInterval &&
		currentIntervalType === "data"
	) {
		debugLog("Restarting the data interval");

		clearInterval(currentInterval);

		currentInterval = setInterval(
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
		newConfig.artistUpdateInterval !== config.artistUpdateInterval &&
		currentIntervalType === "artist"
	) {
		debugLog("Restarting the artist interval");

		clearInterval(currentInterval);

		currentInterval = setInterval(
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
		newConfig.nameUpdateInterval !== config.nameUpdateInterval &&
		currentIntervalType === "name"
	) {
		debugLog("Restarting the name interval");

		clearInterval(currentInterval);

		currentInterval = setInterval(
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
		newConfig.lyricsUpdateInterval !== config.lyricsUpdateInterval &&
		currentIntervalType === "lyrics"
	) {
		debugLog("Restarting the lyrics interval");

		clearInterval(currentInterval);

		currentInterval = setInterval(
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

	const hexColorRegex = /^#(?:[0-9A-F]{3}){1,2}$/i

	if (
		newConfig.tooltipCurrentLyricColor !== undefined &&
		newConfig.tooltipCurrentLyricColor !== null &&
		(
			typeof newConfig.tooltipCurrentLyricColor !== "string" ||
			!hexColorRegex.test(newConfig.tooltipCurrentLyricColor)
		)
	) {
		debugLog("'config.tooltipCurrentLyricColor' must be a string");

		invalidConfig++;

		newConfig.tooltipCurrentLyricColor = "#cba6f7";
	}

	if (
		newConfig.playerSourceColor !== undefined &&
		newConfig.playerSourceColor !== null &&
		(
			typeof newConfig.playerSourceColor !== "string" ||
			!hexColorRegex.test(newConfig.playerSourceColor)
		)
	) {
		debugLog("'config.playerSourceColor' must be a string");

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

	if (
		newConfig.favoritePlayers !== undefined &&
		newConfig.favoritePlayers !== null &&
		!Array.isArray(newConfig.favoritePlayers)
	) {
		debugLog("'config.favoritePlayers' must be an array");

		invalidConfig++;

		newConfig.favoritePlayers = [];
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

	if (
		newConfig.deleteIconWhenPaused !== undefined &&
		newConfig.deleteIconWhenPaused !== null &&
		typeof newConfig.deleteIconWhenPaused !== "boolean"
	) {
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

	if (!(newConfig.musixmatch instanceof Object)) {
		debugLog("'config.musixmatch' must be an object");

		invalidConfig++;

		newConfig.musixmatch = {};
	}

	if (
		newConfig.musixmatch.usertoken !== undefined &&
		newConfig.musixmatch.usertoken !== null &&
		typeof newConfig.musixmatch.usertoken !== "string"
	) {
		debugLog("'config.musixmatch.usertoken' must be a string");

		invalidConfig++;

		newConfig.musixmatch.usertoken = null;
	}

	if (
		newConfig.musixmatch.cookies !== undefined &&
		newConfig.musixmatch.cookies !== null &&
		typeof newConfig.musixmatch.cookies !== "string"
	) {
		debugLog("'config.musixmatch.cookies' must be a string");

		invalidConfig++;

		newConfig.musixmatch.cookies = null;
	}

	if (!Array.isArray(newConfig.sourceOrder)) {
		debugLog("'config.sourceOrder' must be an array");

		invalidConfig++;

		newConfig.sourceOrder = ["musixmatch", "lrclib"];
	}

	if (invalidConfig > 0) {
		try {
			fs.writeFileSync(configFile, JSON.stringify(newConfig, null, 4));
		} catch (e) {
			debugLog("Something went wrong while updating the config file...", e);
		}

		return false;
	}

	return true;
}

function updateIcon(metadata) {
	const url = metadata.iconUrl;

	if (!url) {
		deleteIcon();

		return null;
	}

	debugLog("Fetching song icon");

	const iconPath = config.iconPath || path.join(configFolder, "icon.png");

	if (["http://", "https://"].some((iconUrl) => url.startsWith(iconUrl))) {
		try {
			let error = false;

			fetch(url)
				.then((res) => res.arrayBuffer())
				.then((data) => {
					const buffer = Buffer.from(data);

					try {
						fs.writeFileSync(iconPath, buffer);
					} catch (e) {
						debugLog("Something went wrong while saving the song icon");

						deleteIcon();

						error = true;
					}
				});

			if (error) return null;
		} catch (e) {
			debugLog("Something went wrong while fetching the icon URL");

			deleteIcon();

			return null;
		}
	} else if (url.startsWith("file://")) {
		const path = new URL(url).pathname;

		try {
			fs.copyFileSync(path, iconPath);
		} catch (e) {
			debugLog("Something went wrong while copying the file");

			deleteIcon();

			return null;
		}
	}
}

function escapeMarkup(text) {
	return text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function outputLog(...args) {
	console.info(...args);
}

function debugLog(...args) {
	if (
		config.debug ||
		process.env.DEBUG?.toLowerCase() === "true" ||
		process.argv.includes("--debug")
	)
		console.debug("\x1b[35;1mDEBUG:\x1b[0m", ...args);
}

function updateConfig() {
	if (!fs.existsSync(configFile)) {
		try {
			fs.writeFileSync(configFile, JSON.stringify(config, null, 4));
		} catch (e) {
			debugLog("Something went wrong while creating the config file...", e);

			process.exit(0);
		}
	}

	const configFileContent = fs.readFileSync(configFile, "utf-8");

	let newConfig = {};

	try {
		newConfig = JSON.parse(configFileContent);
	} catch (e) {
		debugLog("Config file is not a valid JSON");

		process.exit(0);
	}

	const isConfigValid = validateConfig(newConfig);

	if (!isConfigValid) return;

	config = newConfig;
}

function marquee(text) {
	if (text.length <= (config.marqueeMinLength || 40)) return text;

	if (text.length < currentMarqueeIndex) {
		currentMarqueeIndex = 0;
	}

	const dividedText = `${text}   `;
	const marqueeText =
		dividedText.slice(currentMarqueeIndex) +
		dividedText.slice(0, currentMarqueeIndex);

	currentMarqueeIndex = (currentMarqueeIndex + 1) % dividedText.length;

	return marqueeText.slice(0, 40);
}

function deleteIcon() {
	currentTrackId = null;

	const iconPath = config.iconPath || path.join(configFolder, "icon.png");

	if (fs.existsSync(iconPath)) {
		debugLog("Deleting the song icon");

		fs.unlinkSync(iconPath);
	}
}
