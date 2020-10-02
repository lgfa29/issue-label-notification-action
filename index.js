const core = require('@actions/core');
const github = require('@actions/github');
const { correctRecipients, correctMessage } = require('./utils');

async function run() {
  try {
    const owner = github.context.repo.owner;
    const repo = github.context.repo.repo;
    const label = github.context.payload.label.name;

    // Check if issue or PR
    const payload = github.context.payload;
    var issueNumber;

    if (payload.pull_request) {
      issueNumber = payload.pull_request.number;
    } else if (payload.issue) {
      issueNumber = payload.issue.number;
    } else {
      console.log("Payload doesn't have an issue or pull request.");
      return;
    }

    // https://help.github.com/en/actions/automating-your-workflow-with-github-actions/authenticating-with-the-github_token#about-the-github_token-secret
    const token = core.getInput('token');
    const octokit = github.getOctokit(token);

    const labelRecipients = core.getInput('recipients').split("\n");
    const match = labelRecipients.find((labelRecipient) => {
      return labelRecipient.split("=")[0] === label;
    });

    const message = core.getInput('message');

    if (match) {
      const recipients = correctRecipients(match.split("=")[1]);
      const comment = correctMessage(message, recipients, label);
      const createCommentResponse = await octokit.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: comment
      });
    } else {
      console.log("No matching recipients found for label ${label}.");
    }
  } catch (error) {
    console.error(error);
    core.setFailed(`The issue-label-notification-action action failed with ${error}`);
  }
}

run();
