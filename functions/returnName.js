module.exports = async () => {
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

			tooltip = formatLyricsTooltipText(lyricsData, metadata);
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
};
