module.exports = (lyrics) => {
	const lyricsSplit = lyrics
		.split("\n")
		.map((lyric) => {
			let lyricText = lyric.split(" ");

			const time = lyricText.shift().replace(/[\[\]]/g, "");

			lyricText = lyricText.join(" ");

			const minutes = time.split(":")[0];
			const seconds = time.split(":")[1];

			const totalSeconds =
				Number.parseFloat(minutes) * 60 + Number.parseFloat(seconds);

			if (lyricText.length > 0)
				return {
					time: totalSeconds,
					text: lyricText,
				};
		})
		.filter(Boolean);

	return lyricsSplit;
};
