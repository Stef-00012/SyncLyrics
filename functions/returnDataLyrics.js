module.exports = async () => {
	const metadata = await fetchPlayerctl();

	if (!metadata) {
		infoLog("no media");

		return outputLog(noMedia);
	}

    const res = await getLyrics(metadata);

	if (!metadata.track && !metadata.artist && !res.lyrics) {
		infoLog("Metadata doesn't include the song name and lyrics");

		return outputLog(noSong);
	}

    let lyrics = "No Lyrics Avaible";
	let tooltip = "none"

    if (res.lyrics) {
		const lyricsData = getLyricsData(metadata, res);

		lyrics = lyricsData.current ?? "No Lyrics Avaible"
		tooltip = formatLyricsTooltipText(lyricsData, metadata);
	}

    let text = "";
	if (metadata.artist) text = metadata.artist;
	if (metadata.track)
		text = text.length > 0 ? `${text} - ${metadata.track}` : metadata.track;

	const data = marquee(text);

	const output = JSON.stringify({
		text: escapeMarkup(`${data ?? "Unkown"} | ${lyrics ?? "No Lyrics Avaible"}`),
		alt: "playing",
		class: `perc${metadata.percentage}-0`,
		tooltip: tooltip,
	});

	outputLog(output);
};
