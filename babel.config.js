module.exports = function (api) {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		env: {
			production: {
				plugins: ["react-native-paper/babel"],
			},
		},
	};
};

module.exports = {
	presets: ["babel-preset-expo"],
	plugins: ["react-native-web"],
};
