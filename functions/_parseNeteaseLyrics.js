module.exports = (slyrics) => {
	let noLyrics;
	const lines = slyrics.split(/\r?\n/).map((line) => line.trim());
	const lyrics = [];

	const creditInfo = [
		"\\s?作?\\s*词|\\s?作?\\s*曲|\\s?编\\s*曲?|\\s?监\\s*制?",
		".*编写|.*和音|.*和声|.*合声|.*提琴|.*录|.*工程|.*工作室|.*设计|.*剪辑|.*制作|.*发行|.*出品|.*后期|.*混音|.*缩混",
		"原唱|翻唱|题字|文案|海报|古筝|二胡|钢琴|吉他|贝斯|笛子|鼓|弦乐| 人声 ",
		"lrc|publish|vocal|guitar|program|produce|write|mix",
	];
	const creditInfoRegExp = new RegExp(
		`^(${creditInfo.join("|")}).*(:|：)`,
		"i",
	);

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const matchResult = line.match(/(\[.*?\])|([^\[\]]+)/g);

		if (!matchResult || matchResult.length === 1) {
			continue;
		}

		let textIndex = -1;
		for (let j = 0; j < matchResult.length; j++) {
			if (!matchResult[j].endsWith("]")) {
				textIndex = j;
				break;
			}
		}

		let text = "";

		if (textIndex > -1) {
			text = matchResult.splice(textIndex, 1)[0];
			text = text.charAt(0).toUpperCase() + normalize(text.slice(1)); // Capitalize and normalize
		}

		const time = matchResult[0];

		if (!creditInfoRegExp.test(text)) {
			lyrics.push(`${time} ${text || ""}`);
		}
	}

	return lyrics.join("\n");
};

function normalize(string) {
	return string
		.replace(/（/g, "(")
		.replace(/）/g, ")")
		.replace(/【/g, "[")
		.replace(/】/g, "]")
		.replace(/。/g, ". ")
		.replace(/；/g, "; ")
		.replace(/：/g, ": ")
		.replace(/？/g, "? ")
		.replace(/！/g, "! ")
		.replace(/、|，/g, ", ")
		.replace(/‘|’|′|＇/g, "'")
		.replace(/“|”/g, '"')
		.replace(/〜/g, "~")
		.replace(/·|・/g, "•")
		.replace(/\s+/g, " ")
		.trim();
}
