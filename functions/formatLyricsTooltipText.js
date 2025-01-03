module.exports = (data, metadata = {}) => {
	const tooltipColor = global.config.tooltipCurrentLyricColor || "#cba6f7";

	let tooltipMetadata = global.config.tooltipIncludeSongMetadata
		? `<span color="${config.tooltipMetadataTrackColor || "#ffffff"}">${escapeMarkup(metadata.track)}</span>\n<span color="${config.tooltipMetadataArtistColor || "#ffffff"}">${escapeMarkup(metadata.artist)}</span>\n<span color="${config.tooltipMetadataAlbumColor || "#ffffff"}">${escapeMarkup(metadata.album)}</span>\n\n`
		: "";

	const previousLyrics =
		data.previous.length > 0
			? `${escapeMarkup(data.previous.join("\n"))}\n`
			: "";

	const nextLyrics =
		data.next.length > 0 ? `\n${escapeMarkup(data.next.join("\n"))}` : "";

	const source = data.source
		? `\n\n<span color="${global.config.tooltipPlayerSourceColor || "#89b4fa"}">[Source: ${data.source}${data.cached && global.config.tooltipSourceIncludeCachedNotice ? " - Cached" : ""}]</span>`
		: "";

	const maxLength = Math.max(
		centerText(tooltipMetadata || "", true),
		centerText(previousLyrics || "", true),
		centerText(data.current || "", true),
		centerText(nextLyrics || "", true),
		centerText(source || "", true),
	);

	const metadataDivider = (
		typeof config.tooltipMetadataDivider === "string" &&
		config.tooltipMetadataDivider.length === 1
			? config.tooltipMetadataDivider
			: "-"
	).repeat(maxLength);

	tooltipMetadata =
		tooltipMetadata.length > 0
			? `${tooltipMetadata}<span color="${config.tooltipMetadataDividerColor || "#ffffff"}">${metadataDivider}</span>\n\n`
			: "";

	const tooltip = `${tooltipMetadata}${previousLyrics}<span color="${
		tooltipColor
	}"><i>${escapeMarkup(data.current)}</i></span>${nextLyrics}${source}`;

	return centerText(tooltip);
};
