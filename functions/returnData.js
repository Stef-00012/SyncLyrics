module.exports = async () => {
	const metadata = fetchPlayerctl();

	if (!metadata) {
		infoLog("no media");

		return outputLog(noMedia);
	}

	if (!metadata.track && !metadata.artist) {
		infoLog("Metadata doesn't include the song or artist name");

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
};