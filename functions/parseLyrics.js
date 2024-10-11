module.exports = (lyrics) => {
	const lyricsSplit = lyrics.split("\n");

	const formattedLyrics = [];
	let lastTime;

	for (const index in lyricsSplit) {
		let lyricText = lyricsSplit[index].split(" ");

		const time = lyricText.shift().replace(/[\[\]]/g, "");

		lyricText = lyricText.join(" ");

		const minutes = time.split(":")[0];
		const seconds = time.split(":")[1];

		const totalSeconds =
			Number.parseFloat(minutes) * 60 + Number.parseFloat(seconds);

		const instrumentalLyricIndicator =
			config.instrumentalLyricIndicator || " ";

		if (index === "0" && totalSeconds > 3 && instrumentalLyricIndicator) {
			formattedLyrics.push({
				time: 0,
				text: instrumentalLyricIndicator,
			});
		}

		if (lyricText.length > 0) {
			lastTime = time;

			formattedLyrics.push({
				time: totalSeconds,
				text: lyricText,
			});

			continue;
		}

		if (instrumentalLyricIndicator && (!lastTime || lastTime - time > 3)) {
			lastTime = time;

			formattedLyrics.push({
				time: totalSeconds,
				text: instrumentalLyricIndicator,
			});
		}
	}

	return formattedLyrics;
};
