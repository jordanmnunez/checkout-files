const core = require('@actions/core');
const https = require('https');
const fs = require('fs');

const files = core.getInput('files').split(' ');
const repository = process.env['GITHUB_REPOSITORY']

function dowloadFile(fileName) {
    console.log('Downloading ' + fileName + '...')
    const file = fs.createWriteStream(fileName);
    https.get("https://raw.githubusercontent.com/" + repository + '/master/' + fileName, function(response) {
        response.pipe(file);
    });
}

for (let file of files) {
    dowloadFile(file);
}