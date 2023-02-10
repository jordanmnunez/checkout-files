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
        path,
        ...baseContentParams,
    });

    if (Array.isArray(data)) {
        data.forEach(fileData => {
            getContent({ path: fileData.path });
        })
    } else {
        let fileString = Buffer.from(data.content, 'base64').toString('utf-8');
        if (fileString.length == 0 && data.size > 0) {
            const rawData = getRawFile({ path });
            console.log(`RAW `, rawData);
        }

        saveToFile({ path, fileString });
        // try {
        //     // let const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
        //     saveToFile({
        //         path,
        //         fileString: await getRawFile(data),
        //     });
        // } catch (e) {
        //     throw e
        // }

    }
}

async function getRawFile({ path }) {
    const { data } = await octokit.rest.repos.getContent({
        ...baseContentParams,
        path,
        mediaType: {
            format: "raw"
        },
    });

    return data;
}

function saveToFile({ path, fileString }) {
    if (path.includes('/')) {
        let foldersPath = path.split('/')
        foldersPath.pop()
        fs.mkdirSync(foldersPath.join('/'), { recursive: true });
    }
    fs.writeFile(path, fileString, err => { if (err) throw err });
}

files.forEach(path => {
    getContent({ path });
})