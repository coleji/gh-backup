const ini = require('ini')
const fs = require('fs')
const https = require('https');
const exec = require('child_process').exec;
const path = require("path")
var promiseSequence = require("promisedotseq");

const { username, password, skip } = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));

const API_HOST = "api.github.com";
const OUTPUT_DIR = 'out'

function makeApiCall(path) {
	return new Promise((resolve, reject) => {
		const options = {
			host: API_HOST,
			path,
			headers: {
				'User-Agent': "nodejs",
			},
			auth: username + ':' + password
		};
		https.get(options, res => {
			var ret = "";
			res.on('data', d => {
				ret += d;
			});
			res.on("end", () => resolve(JSON.parse(ret)))
		});
	});
}

function cloneRepo(r) {
	const {html_url, name} = r;
	const urlAddAuth = html_url.replace("github.com", `${username}:${password}@github.com`)
	if (skip[name]) {
		console.log("SKIPPING " + name)
		return Promise.resolve();
	} else {
		console.log("saving " + name)
		return new Promise((resolve, reject) => {
			const cmd = `cd ${path.resolve(process.cwd(), OUTPUT_DIR)} && rm ${name} -rf && git clone ${urlAddAuth}`;
		//	console.log(cmd)
			exec(cmd, () => resolve());
		})
	}
}

makeApiCall("/user/repos?per_page=100").then(repos => {
	console.log(repos.length)
	console.log(repos.map(r => r.name))
	promiseSequence(repos.map(r => () => cloneRepo(r)))
})

console.log(skip)