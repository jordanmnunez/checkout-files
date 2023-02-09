const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');

const token = core.getInput('token');
const octokit = github.getOctokit(token)


const files = core.getInput('files', { required: true }).split(' ');
const repository = process.env['GITHUB_REPOSITORY']

const owner = repository.split('/')[0]
const repo = repository.split('/')[1]
const ref = core.getInput('branch');

const baseContentParams = {
    owner,
    repo,
    ...(ref ? { ref } : {}),
}


async function getContent({ path }) {
    const { data } = await octokit.rest.repos.getContent({
        ...baseContentParams,
        path,
        mediaType: {
            format: "json"
        },
    });

    if (Array.isArray(data)) {
        data.forEach(({ path }) => getContent({ path }))
    } else {
        let fileString = decodeContent(data.content);

        // Bypess 1MB max on mediaType: JSON
        if (data.size >= 1000000) {
            fileString = fetchAndSaveRawFile(data);
        }

        saveToFile({ path, fileString });
    }
}

async function fetchAndSaveRawFile({ path }) {
    const { data } = await octokit.rest.repos.getContent({
        ...baseContentParams,
        path,
        mediaType: {
            format: "raw"
        },
    });

    return data;
}

function decodeContent(content) {
    return Buffer.from(content, 'base64').toString('utf-8');
}

function saveToFile({ path, fileString }) {
    if (path.includes('/')) {
        let foldersPath = data.path.split('/')
        foldersPath.pop()
        fs.mkdirSync(foldersPath.join('/'), { recursive: true });
    }
    fs.writeFile(data.path, fileString, err => { if (err) throw err });
}

files.forEach(file => {
    getContent(file);
})