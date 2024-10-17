module.exports = async () => {
	const metadata = await fetchPlayerctl();

	if (!metadata) return outputLog();

	const lyrics = await getLyrics(metadata);

	if (!lyrics) return outputLog(noLyrics);

	const lyricsData = getLyricsData(metadata, lyrics);
	const tooltip = formatLyricsTooltipText(lyricsData, metadata);

	const output = JSON.stringify({
		text: escapeMarkup(lyricsData.current),
		alt: "lyrics",
		class: "none",
		tooltip: tooltip,
	});

	outputLog(output);
};
