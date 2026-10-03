import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { runGrader } from '../../../../src/main/grading-run';
import { projectRouter } from '../../../../src/main/project-router';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test.each([
  ['HTTP API I', 'home-page', '', '<link rel="stylesheet" href="style.css">'],
  ['HTTP API II', 'index-page', '', '<link rel="stylesheet" href="style.css">'],
  ['Streaming Media', 'index-page', '', '<video src="party.mp4"></video>'],
  ['Streaming Media', 'page-2', 'page2', '<audio><source src="bling.mp3"></audio>'],
  ['Streaming Media', 'page-3', 'page3', '<video><source src="bird.mp4"></video>']
])('%s %s checks the required resource and resolves relative paths after HTTPS redirects', async (assignment, check, path, element) => {
  const { url, graders } = Effect.runSync(projectRouter({ assignment, url: 'http://submission.example/course/' }));
  const target = `https://submission.example/course/${path}`;
  server.use(http.get(`http://submission.example/course/${path}`, () => HttpResponse.redirect(target)));
  server.use(http.get(target, () => HttpResponse.html(`<base href="/course/">${element}`)));
  expect(await Effect.runPromise(runGrader(url, graders[check]))).toMatchObject({ status: 'pass' });

  server.use(http.get(target, () => HttpResponse.html('<h1>A page with no required resource</h1>')));
  expect(await Effect.runPromise(runGrader(url, graders[check]))).toMatchObject({ status: 'fail', message: expect.stringContaining('must load') });
});

test.each(['Simple HTTP', 'Streaming Media'])('%s rejects a fallback page that differs from the index', async (assignment) => {
  const { url, graders } = Effect.runSync(projectRouter({ assignment, url: 'https://submission.example/' }));
  server.use(
    http.get(url.href, () => HttpResponse.html('<h1>Home</h1>')),
    http.get(`${url}__grader_unknown_route__`, () => HttpResponse.html('<h1>Not found</h1>'))
  );
  expect(await Effect.runPromise(runGrader(url, graders['fallback-route']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('index page')
  });
});
