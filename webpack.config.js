const path = require('path');

module.exports = {
	//mode: "production",
	mode: "development",
	entry: './src/index',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'index.js'
	},
	module: {
		rules: [
			{
				test: /\.less$/,
				use: ['style-loader', 'css-loader', 'less-loader']
			},
			{
				test: /\.js$/,
				use: 'babel-loader'
			},
			{
				test: /\.(png|jpg|jpeg)$/,
				use: 'url-loader'
			}
		]
	}
}