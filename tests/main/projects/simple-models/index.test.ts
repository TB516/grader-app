import { Effect } from 'effect';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, test } from 'vitest';
import { gradingRun, runGrader } from '../../../../src/main/grading-run';
import { projectRouter } from '../../../../src/main/project-router';
import { simpleModelsGraders } from '../../../../src/main/projects/simple-models';
import type { GradingEvent } from '../../../../src/shared/types';

const baseUrl = 'https://simple-models.example/course/';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

type Dog = { name: string; breed: string; age: number };

// Intentionally use different routes and field names from Thomas's submission.
// The rubric defines the behavior, not these implementation choices.
const forms = (method = 'POST', encoding = 'application/x-www-form-urlencoded') => `
  <form action="dogs/create" method="${method}" enctype="${encoding}">
    <input type="hidden" name="token" value="fixture-token">
    <label for="dog-name">Name</label><input id="dog-name" name="newDogName">
    <label>Breed<input name="dogBreed" type="text"></label>
    <label>Age<input name="dogAge" type="number"></label>
    <button name="operation" value="create">Create dog</button>
  </form>
  <form action="dogs/birthday" method="${method}" enctype="${encoding}">
    <input name="lookupName" type="text"><button>Age dog</button>
  </form>`;

const renderDog = (dog: Dog) => `<li>${dog.name} is a ${dog.age} year old ${dog.breed}</li>`;

function submission(
  options: {
    method?: 'GET' | 'POST';
    encoding?: string;
    renderList?: (dogs: Dog[]) => string;
    increment?: number;
    ageEveryDog?: boolean;
    redirect?: boolean;
  } = {}
) {
  const dogs: Dog[] = [{ name: 'Existing', breed: 'Poodle', age: 9 }];
  const readFields = async (request: Request) => {
    if (request.method === 'GET') return new URL(request.url).searchParams;
    return request.formData();
  };
  server.use(
    ...['', 'page1', 'page2'].map((path) => http.get(`${baseUrl}${path}`, () => HttpResponse.html('<h1>Page</h1>'))),
    http.get(`${baseUrl}page3`, () => HttpResponse.html(forms(options.method, options.encoding))),
    http.get(`${baseUrl}page4`, () => HttpResponse.html(`<ul>${options.renderList?.(dogs) ?? dogs.map(renderDog).join('')}</ul>`)),
    http.all(`${baseUrl}dogs/create`, async ({ request }) => {
      expect(request.method).toBe(options.method ?? 'POST');
      const fields = await readFields(request);
      expect(fields.get('token')).toBe('fixture-token');
      expect(fields.get('operation')).toBe('create');
      const name = fields.get('newDogName');
      const breed = fields.get('dogBreed');
      const age = fields.get('dogAge');
      if (!name || !breed || !age) return HttpResponse.html('<p>Name, breed and age are required</p>', { status: 400 });
      dogs.push({ name: String(name), breed: String(breed), age: Number(age) });
      if (options.redirect) return HttpResponse.redirect(`${baseUrl}page4`, 303);
      return HttpResponse.text('Created', { status: 201 });
    }),
    http.all(`${baseUrl}dogs/birthday`, async ({ request }) => {
      const fields = await readFields(request);
      const dog = dogs.find((dog) => dog.name === fields.get('lookupName'));
      // The PDF does not prescribe an error status or JSON response shape.
      if (!dog) return HttpResponse.html('<p>No dog with that name exists.</p>');
      const previous = { ...dog };
      for (const target of options.ageEveryDog ? dogs : [dog]) target.age += options.increment ?? 1;
      return HttpResponse.json(previous);
    })
  );
  return dogs;
}

test('Simple Models runs its checks through the application registry', async () => {
  const dogs = submission();
  const events: GradingEvent[] = [];
  const { url, graders } = Effect.runSync(projectRouter({ assignment: 'Simple Models', url: baseUrl }));
  await Effect.runPromise(gradingRun('models', url, graders, (event) => events.push(event)));
  expect(events[0].type).toBe('started');
  const results = events.filter((event) => event.type === 'result');
  expect(Object.fromEntries(results.map(({ check }) => [check.id, check.result?.status]))).toEqual({
    pages: 'pass',
    'dog-forms': 'pass',
    'dog-lifecycle': 'pass'
  });
  expect(events.at(-1)).toEqual({ runId: 'models', type: 'finished', outcome: 'completed' });
  expect(dogs).toEqual([
    { name: 'Existing', breed: 'Poodle', age: 9 },
    { name: expect.stringMatching(/^grader/), breed: 'Beagle', age: 2 },
    { name: expect.stringMatching(/^grader/), breed: 'Collie', age: 5 }
  ]);
});

test.each([{ method: 'GET' as const }, { encoding: 'multipart/form-data' }, { redirect: true }])(
  'Follows the submitted forms with %j',
  async (options) => {
    submission(options);
    expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({ status: 'pass' });
  }
);

test.each(['', ' ID: 123'])('Reports an incomplete age check when the list has no explicit age (extra text: %s)', async (extra) => {
  submission({ renderList: (dogs) => dogs.map((dog) => `<li>${dog.name}${extra}</li>`).join('') });
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({
    status: 'error',
    message: expect.stringContaining('age changes could not be verified')
  });
});

test.each([0, 2, -1])('Rejects a lookup that changes age by %i instead of one', async (increment) => {
  submission({ increment });
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('should have age 1')
  });
});

test('Rejects a lookup that also ages another dog', async () => {
  submission({ ageEveryDog: true });
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('should have age 5')
  });
});

test.each([
  { label: 'does not persist dogs', renderList: () => '' },
  { label: 'shows only the newest dog', renderList: (dogs: Dog[]) => renderDog(dogs.at(-1)!) },
  { label: 'uses divs instead of list items', renderList: (dogs: Dog[]) => dogs.map((dog) => `<div>${dog.name}</div>`).join('') },
  { label: 'puts all dogs in one list item', renderList: (dogs: Dog[]) => `<li>${dogs.map((dog) => dog.name).join(', ')}</li>` }
])('Rejects a list that $label', async ({ renderList }) => {
  submission({ renderList });
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({ status: 'fail' });
});

test.each(['newDogName', 'dogBreed', 'dogAge'])('Checks missing and empty %s independently', async (field) => {
  for (const value of [null, '']) {
    submission();
    server.use(
      http.post(`${baseUrl}dogs/create`, async ({ request }) => {
        const fields = await request.clone().formData();
        if (fields.get(field) === value) return HttpResponse.text('Accepted');
        return undefined;
      })
    );
    expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({
      status: 'fail',
      message: expect.stringContaining(value === null ? 'Missing' : 'Empty')
    });
    server.resetHandlers();
  }
});

test('Rejects invalid creation that returns an error but still saves a dog', async () => {
  const dogs = submission();
  server.use(
    http.post(`${baseUrl}dogs/create`, async ({ request }) => {
      const fields = await request.clone().formData();
      if (fields.has('newDogName')) return undefined;
      dogs.push({ name: 'Accidentally saved', breed: 'Beagle', age: 3 });
      return HttpResponse.text('Missing name', { status: 400 });
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('invalid request changed the dog list')
  });
});

test('Missing-dog lookups must explain that the dog does not exist', async () => {
  submission();
  server.use(
    http.post(`${baseUrl}dogs/birthday`, async ({ request }) => {
      const fields = await request.clone().formData();
      if (String(fields.get('lookupName')).startsWith('missing')) return HttpResponse.text('Internal error', { status: 500 });
      return undefined;
    })
  );
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-lifecycle']))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('nonexistent dog')
  });
});

test('Rejects a missing starter page', async () => {
  submission();
  server.use(http.get(`${baseUrl}page2`, () => new HttpResponse(null, { status: 404 })));
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders.pages))).toMatchObject({
    status: 'fail',
    message: expect.stringContaining('/course/page2')
  });
});

test.each([
  { html: forms().replace('type="number"', 'type="text"'), status: 'fail' },
  { html: '<form><input name="name"></form>', status: 'fail' },
  { html: forms() + forms(), status: 'error' },
  { html: forms().replace('dogs/create', 'https://another.example/create'), status: 'error' }
])('Reports unusable or ambiguous forms as $status', async ({ html, status }) => {
  server.use(http.get(`${baseUrl}page3`, () => HttpResponse.html(html)));
  expect(await Effect.runPromise(runGrader(new URL(baseUrl), simpleModelsGraders['dog-forms']))).toMatchObject({ status });
});
