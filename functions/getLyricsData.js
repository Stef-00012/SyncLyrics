module.exports = (metadata, lyrics) => {
	let firstLyric;
	let lastLyric;

	let firstTimestamp;
	let lastTimestamp;

	const parsedLyrics = parseLyrics(lyrics);

	for (const lyric of parsedLyrics) {
		const timestamp = lyric.time;
		const text = lyric.text;

		if (!firstLyric) firstLyric = text;
		if (!firstTimestamp && firstTimestamp !== 0) firstTimestamp = timestamp;

		if (metadata.currentMs / 1000 >= timestamp) {
			lastLyric = text;
			lastTimestamp = timestamp;
		}
	}

	const searchLyric = lastLyric || firstLyric;
	const searchTimestamp = lastTimestamp || firstTimestamp;

	if (!searchLyric) {
		infoLog("No lastLyric and firstLyric avaible");

		return null;
	}

	let previousLinesAmount = 0;
	let nextLinesAmount = 0;

	const currentLyricIndex = parsedLyrics.findIndex(
		(lyric) => lyric.time === searchTimestamp && lyric.text === searchLyric,
	);

	if (currentLyricIndex === 1) previousLinesAmount = 1;
	else if (currentLyricIndex === 2) previousLinesAmount = 2;
	else if (currentLyricIndex >= 3) previousLinesAmount = 3;

	if (currentLyricIndex === parsedLyrics.length - 1) nextLinesAmount = 1;
	else if (currentLyricIndex === parsedLyrics.length - 2) nextLinesAmount = 2;
	else if (currentLyricIndex <= parsedLyrics.length - 3) nextLinesAmount = 3;

	const previousLines = [...parsedLyrics]
		.splice(currentLyricIndex - previousLinesAmount, previousLinesAmount)
		.map((lyric) => lyric.text);

	const nextLines = [...parsedLyrics]
		.splice(currentLyricIndex + 1, nextLinesAmount)
		.map((lyric) => lyric.text);

	return {
		previous: previousLines,
		current: searchLyric,
		next: nextLines,
	};
};
