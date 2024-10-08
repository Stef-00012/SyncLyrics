module.exports = (text) => {
	if (text.length <= (config.marqueeMinLength || 40)) return text;

	if (text.length < currentMarqueeIndex) {
		currentMarqueeIndex = 0;
	}

	const dividedText = `${text}${config.marqueeDivider || "  "}`;
	const marqueeText =
		dividedText.slice(currentMarqueeIndex) +
		dividedText.slice(0, currentMarqueeIndex);

	currentMarqueeIndex = (currentMarqueeIndex + 1) % dividedText.length;

	return marqueeText.slice(0, config.marqueeMinLength);
};
