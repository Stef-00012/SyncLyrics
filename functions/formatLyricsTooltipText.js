const centerText = require("./centerText");

module.exports = (data, metadata = {}) => {
	const tooltipColor = global.config.tooltipCurrentLyricColor || "#cba6f7";

	let tooltipMetadata = global.config.tooltipIncludeSongMetadata
		? escapeMarkup(
				`${metadata.track}\n${metadata.artist}\n${metadata.album}\n\n`,
			)
		: "";

	const previousLyrics =
		data.previous.length > 0
			? `${escapeMarkup(data.previous.join("\n"))}\n`
			: "";

	const nextLyrics =
		data.next.length > 0 ? `\n${escapeMarkup(data.next.join("\n"))}` : "";

	const source = global.lyricsSource
		? `\n\n<span color="${global.config.playerSourceColor || "#89b4fa"}">[Source: ${global.lyricsSource}${global.lyricsCached && global.config.tooltipSourceIncludeCachedNotice ? " - Cached" : ""}]</span>`
		: "";

	const maxLength = Math.max(
		centerText(tooltipMetadata || "", true),
		centerText(previousLyrics || "", true),
		centerText(data.current || "", true),
		centerText(nextLyrics || "", true),
		centerText(source || "", true),
	);

	tooltipMetadata += `${(typeof config.tooltipMetadataDivider === "string" && config.tooltipMetadataDivider.length === 1 ? config.tooltipMetadataDivider : "-").repeat(maxLength)}\n\n`;

	const tooltip = `${tooltipMetadata}${previousLyrics}<span color="${
		tooltipColor
	}"><i>${escapeMarkup(data.current)}</i></span>${nextLyrics}${source}`;

	return centerText(tooltip);
};
