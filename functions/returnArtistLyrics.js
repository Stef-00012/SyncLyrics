module.exports = async () => {
	const metadata = await fetchPlayerctl();

	if (!metadata) {
		infoLog("no media");

		return outputLog(noMedia);
	}

    const res = await getLyrics(metadata);

	if (!metadata.artist && !res.lyrics) {
		infoLog("Metadata doesn't include the artist name and lyrics");

		return outputLog(noSong);
	}

    let lyrics = "No Lyrics Avaible";
	let tooltip = "none"

    if (res.lyrics) {
		const lyricsData = getLyricsData(metadata, res);

		lyrics = lyricsData.current ?? "No Lyrics Avaible"
		tooltip = formatLyricsTooltipText(lyricsData, metadata);
	}

	const artist = marquee(`${metadata.artist}`);

	const output = JSON.stringify({
		text: escapeMarkup(`${artist ?? "Unkown"} | ${lyrics ?? "No Lyrics Avaible"}`),
		alt: "playing",
		class: `perc${metadata.percentage}-0`,
		tooltip: tooltip,
	});

	outputLog(output);
};
