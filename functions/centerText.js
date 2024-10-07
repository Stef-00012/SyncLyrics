module.exports = (inputString, returnLength = false) => {
	const lines = inputString.split("\n");

	let maxLength = 0;

	for (const line of lines) {
		const textContent = line.replace(/<[^>]*>/g, "");

		if (textContent.length > maxLength) maxLength = textContent.length;
	}

	if (returnLength) return maxLength;

	const centeredLines = lines.map((line) => {
		const textContent = line.replace(/<[^>]*>/g, "");
		const paddingBefore = " ".repeat(
			Math.floor((maxLength - textContent.length) / 2),
		);
		const paddingAfter = " ".repeat(
			Math.ceil((maxLength - textContent.length) / 2),
		);
		const centeredLine = `${paddingBefore}${textContent}${paddingAfter}`;

		const htmlTagMatch = line.match(/<[^>]*>/);

		if (htmlTagMatch) {
			const paddedContent = `${paddingBefore}${textContent}${paddingAfter}`;
			return line.replace(textContent, paddedContent);
		}

		return centeredLine;
	});

	return centeredLines.join("\n");
};
