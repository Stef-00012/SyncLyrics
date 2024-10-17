module.exports = async () => {
	const metadata = await fetchPlayerctl();

	if (!metadata) {
		infoLog("no media");

		return outputLog(noMedia);
	}

	if (!metadata.artist) {
		infoLog("Metadata doesn't include the artist name");

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

	const data = marquee(`${metadata.artist}`);

	const output = JSON.stringify({
		text: escapeMarkup(data),
		alt: "playing",
		class: `perc${metadata.percentage}-0`,
		tooltip: tooltip,
	});

	outputLog(output);
};
