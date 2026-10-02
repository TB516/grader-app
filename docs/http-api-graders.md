# HTTP API grader coverage

The assignment PDFs in `project-pdfs` define the requirements. These graders check
HTTP behavior; a passing run is not a complete rubric score.

## HTTP API I

Source: [HTTP API assignment](../project-pdfs/HTTP_API_Assignment.pdf).

Automated checks:

- Home page and `/style.css` return 200, the expected content type, and nonempty bodies.
- All specified API routes return their required status codes, including an unknown route.
- `/badRequest` and `/unauthorized` handle missing, incorrect, and correct query values.
- API responses are JSON with no Accept header, JSON with `Accept: application/json`,
  and XML with `Accept: text/xml`.
- JSON parses correctly; XML is well formed. Both contain a nonempty message and
  the appropriate error ID on failures.

Successful responses may include extra fields, including an ID. For `/internal`,
`internalError` matches the PDF example and `internalServerError` spells out the
status name; both are accepted. XML may use either `text/xml` or `application/xml`.

The no-Accept check uses Node's HTTP client because fetch adds `Accept: */*` by default.
The tests include a real local HTTP server to verify the header is absent on the wire.

## HTTP API II

Source: [HTTP API II assignment](../project-pdfs/http-api-assignment-2-v2.pdf).

Automated checks:

- Home page and CSS availability and content types.
- `/getUsers` GET returns a usable JSON user collection.
- `/getUsers` and `/notReal` HEAD return the required status and JSON content type,
  with no body exposed to the HTTP client.
- `/notReal` and an arbitrary unknown route return JSON 404 errors containing a
  nonempty message and ID.
- `/addUser` creates a unique user with 201 and a message, persists the submitted
  age, updates it with 204, and returns the updated age from `/getUsers`.
- Missing name, missing age, both missing, and empty fields return 400 with a
  message and ID. These requests must not change the existing test user's age.

POSTs can use URL-encoded body data or query parameters. The grader first tries a
body; if the server rejects it with 400 or 415, it tries query parameters. It then
uses that transport consistently for validation and updates. This is an explicit
project decision pending clarification of the course requirements.

The PDF allows different collection structures. The grader accepts keyed user
objects or arrays, either directly or inside `users`. Names may come from object
keys, and ages may be numeric strings or numbers.

Each run creates a uniquely named test user. The assignment defines no delete
endpoint, so the grader leaves that record behind. Use a disposable assignment
instance when possible.

## Manual review still required

For both assignments, check the supplied client page in a browser. The HTTP checks
do not establish that its CSS loads, its controls send the right requests, or its
JavaScript displays responses correctly. API I also requires content-type-based
JSON/XML parsing and raw-response console logging. API II requires correct handling
of HEAD, error responses, and the bodyless 204 response.

Review source, ESLint, GitHub Actions, deployment, and submission requirements
separately. Native HTTP clients suppress HEAD and 204 bodies, so these graders do
not inspect illegal extra bytes sent on the wire. API I reports one result per
format and stops that format's checks at the first failure. API II reports the
create/validate/update sequence as one result.

All new HTTP requests have a ten-second deadline. Unexpected grader exceptions
become error results so other checks can complete. User cancellation and cleanup
when the results window closes still need app-wide work.

## Verification against existing submissions

The review used temporary clones of:

- `TB516/http-api-assignment` at `b621ac92ee1f296625d31fe05386cbcdf890899f`.
  Its `/internal` handler checks `request.headers.accepts`, so XML requests return
  JSON. The XML grader correctly fails that endpoint. Fixing that typo in the
  temporary clone makes all five grader groups pass.
- `TB516/http-api-assignment-ii` at `8009a03fab5c83b892501124e2d405505b0ba1fd`.
  It uses query-string POST parameters and accepts an omitted name. The grader
  correctly fails the missing-name check. Fixing missing/empty-field validation in
  the temporary clone makes all eight grader groups pass.

No changes were pushed to either submission repository. These examples supplement
the PDF-based tests; their behavior does not define the grading rules.

Run `pnpm test` for automated tests and `pnpm build` for application and test type
checks plus the production build. Tests do not depend on the submission clones.
