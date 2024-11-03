module.exports = async () => {
	const metadata = await fetchPlayerctl();

	if (!metadata) return outputLog();

	const res = await getLyrics(metadata);

	if (!res.lyrics) return outputLog(noLyrics);

	const lyricsData = getLyricsData(metadata, res);
	const tooltip = formatLyricsTooltipText(lyricsData, metadata);

	const output = JSON.stringify({
		text: escapeMarkup(lyricsData.current),
		alt: "lyrics",
		class: "none",
		tooltip: tooltip,
	});

	outputLog(output);
};
