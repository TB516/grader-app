# Grader

A desktop app that checks a deployed Rich Media Web App Dev II assignment against its rubric. Pick the assignment, paste the link to the running project, and Grader sends it the same requests the assignment describes and shows which rubric items pass or fail.

## Using Grader

1. Open Grader and choose the assignment on the left.
2. Paste the project's URL (for example `https://my-project.herokuapp.com`) and select **Run Tests**.
3. A results window opens and fills in as each check finishes. You can grade several projects at once, since each one gets its own window.

Each check shows one of these results:

- **Pass**: the project did what the rubric asks.
- **Fail**: the project responded, but not the way the rubric asks. Open **Details** to see what came back.
- **Error**: Grader could not reach the project or read its response. Check that the URL is right and the project is running.
- **Cancelled**: grading was stopped before the check finished.

Grader only sends web requests to the project. It does not read the source code, so code quality and other manual rubric items still need a person to review them.

## Supported assignments

- Simple HTTP

More assignments are being added.
