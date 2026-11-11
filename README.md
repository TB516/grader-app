# Grader

A desktop app that checks a deployed Rich Media Web App Dev II assignment against its rubric. Pick the assignment, paste the link to the running project, and Grader sends it the same requests the assignment describes and shows which rubric items pass or fail.

## Using Grader

1. Open Grader and choose the assignment.
2. Enter the site's address (for example `my-project.onrender.com`) and select **Grade**. You can leave off `https://`.
3. A results window opens and fills in as each check finishes. You can grade several sites at once, since each one gets its own window. In a results window, **Cancel** stops grading, **Run again** grades the site again, and **Copy results** copies a plain-text summary.

Each check shows one of these results:

- **Passed**: the project did what the rubric asks.
- **Failed**: the project responded, but not the way the rubric asks. Open **Details** to see what came back.
- **Error**: Grader could not reach the project or read its response. Check that the URL is right and the project is running.
- **Cancelled**: grading was stopped before the check finished.

Grader only sends web requests to the project. It does not read the source code, so code quality and other manual rubric items still need a person to review them.

## Supported assignments

- Simple HTTP

More assignments are being added.
