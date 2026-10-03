import { randomUUID } from 'node:crypto';
import { load } from 'cheerio';
import { Effect, type Scope } from 'effect';
import type { GraderResult } from '../../../../shared/types';
import type { Grader } from '../../../types';
import { responseDetails } from '../../utils/details';
import { projectUrl } from '../../utils/project-url';
import { responseText } from '../../utils/response-body';
import { readDogForms, readPage, submitForm } from './forms';

type Dog = { name: string; breed: string; age: number };

const readDogList = Effect.fn(function* (url: URL) {
  const { page } = yield* readPage(projectUrl(url, '/page4'));
  return page('li')
    .toArray()
    .map((element) => {
      const item = page(element).clone();
      item.find('script, style, ul, ol').remove();
      return item.text().replace(/\s+/gu, ' ').trim();
    });
});

const findDog = Effect.fn(function* (items: string[], dog: Dog): Effect.fn.Return<string, GraderResult> {
  const matches = items.filter((text) => text.includes(dog.name));
  if (matches.length !== 1) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `/page4 must show ${dog.name} in its own list item exactly once`,
      details: JSON.stringify({ dog, matchingItems: matches })
    });
  }
  return matches[0];
});

// The PDF requires a list, but does not require an age column or a particular sentence.
// Only read numbers explicitly identified as ages; other numbers may be IDs or dates.
const displayedAge = (item: string, dog: Dog): number | null => {
  const text = item.replaceAll(dog.name, '').replaceAll(dog.breed, '');
  const labelled = /\bage\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)\b/iu.exec(text) ?? /(?<!\w)([+-]?\d+(?:\.\d+)?)\s*years?\b/iu.exec(text);
  if (labelled) return Number(labelled[1]);
  return null;
};

const checkAge = Effect.fn(function* (items: string[], dog: Dog): Effect.fn.Return<boolean, GraderResult> {
  const item = yield* findDog(items, dog);
  const age = displayedAge(item, dog);
  if (age === null) return false;
  if (age !== dog.age) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${dog.name} should have age ${dog.age}, but /page4 shows ${age}`,
      details: item
    });
  }
  return true;
});

const checkSuccess = Effect.fn(function* (response: Response, step: string) {
  if (!response.ok) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${step}: the form submission was not successful`,
      details: responseDetails(response)
    });
  }
  // Consume the response even when it redirects to HTML or returns no JSON data.
  yield* responseText(response, `${step}: could not read the response`);
});

const checkError = Effect.fn(function* (response: Response, step: string, missingDog = false) {
  const body = yield* responseText(response, `${step}: could not read the response`);
  const page = load(body);
  page('script, style').remove();
  const message = page.root().text().trim();
  const saysMissing = /not[ -]?found|not exist|doesn't exist|no\b.*\bdog|missing|unknown|cannot find|could not find/iu.test(message);
  const hasError = response.status >= 400 || saysMissing || /\berror\b|invalid|required|cannot|could not|unable/iu.test(message);
  if (!message || !hasError || (missingDog && !saysMissing)) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${step}: the response did not explain the error`,
      details: message.slice(0, 2000)
    });
  }
});

const checkUnchanged = Effect.fn(function* (url: URL, before: string[], step: string) {
  const after = yield* readDogList(url);
  if (JSON.stringify([...before].sort()) !== JSON.stringify([...after].sort())) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: `${step}: an invalid request changed the dog list`,
      details: JSON.stringify({ before, after })
    });
  }
});

export const dogLifecycleGrader: Grader = {
  label: 'Dog Forms Create, List, Age, And Validate Dogs',
  run: (url) =>
    Effect.gen(function* (): Effect.gen.Return<GraderResult, GraderResult, Scope.Scope> {
      const forms = yield* readDogForms(url);
      const first: Dog = { name: `grader${randomUUID().slice(0, 8)}`, breed: 'Beagle', age: 0 };
      const second: Dog = { name: `grader${randomUUID().slice(0, 8)}`, breed: 'Collie', age: 5 };
      const dogs = [first, second];
      let agesVisible = true;

      for (const dog of dogs) {
        const response = yield* submitForm(forms.create.submission, {
          [forms.create.fields.name]: dog.name,
          [forms.create.fields.breed]: dog.breed,
          [forms.create.fields.age]: String(dog.age)
        });
        yield* checkSuccess(response, `Create ${dog.name}`);
        const items = yield* readDogList(url);
        agesVisible = (yield* checkAge(items, dog)) && agesVisible;
        // Adding a second dog must preserve the first dog's list item.
        yield* findDog(items, first);
        if (dog === second && items.filter((text) => text.includes(first.name) || text.includes(second.name)).length !== 2) {
          return { status: 'fail', message: '/page4 must give each dog a separate <li> element' };
        }
      }

      for (let increment = 1; increment <= 2; increment += 1) {
        const response = yield* submitForm(forms.age.submission, { [forms.age.name]: first.name });
        yield* checkSuccess(response, `Increase ${first.name}'s age`);
        const items = yield* readDogList(url);
        agesVisible = (yield* checkAge(items, { ...first, age: first.age + increment })) && agesVisible;
        agesVisible = (yield* checkAge(items, second)) && agesVisible;
      }

      const beforeInvalid = yield* readDogList(url);
      const missing = `missing${randomUUID().slice(0, 8)}`;
      const lookupResponse = yield* submitForm(forms.age.submission, { [forms.age.name]: missing });
      yield* checkError(lookupResponse, 'Look up a nonexistent dog', true);
      yield* checkUnchanged(url, beforeInvalid, 'Look up a nonexistent dog');

      for (const field of ['name', 'breed', 'age'] as const) {
        for (const empty of [false, true]) {
          const fields: Record<string, string> = {
            [forms.create.fields.name]: `invalid${randomUUID().slice(0, 8)}`,
            [forms.create.fields.breed]: 'Beagle',
            [forms.create.fields.age]: '3'
          };
          const step = `${empty ? 'Empty' : 'Missing'} ${field}`;
          if (empty) fields[forms.create.fields[field]] = '';
          else delete fields[forms.create.fields[field]];
          const response = yield* submitForm(forms.create.submission, fields);
          yield* checkError(response, step);
          yield* checkUnchanged(url, beforeInvalid, step);
        }
      }

      const details = `Test dogs: ${first.name}, ${second.name}. The rubric has no delete route, so these records remain in the submission's database.`;
      if (!agesVisible) {
        return {
          status: 'error',
          message:
            'Creation, listing, and invalid requests passed, but age changes could not be verified because /page4 does not expose an unambiguous age.',
          details
        };
      }
      return {
        status: 'pass',
        message: `Two dogs were listed separately; lookup increased only the named dog by one twice; missing dogs and missing or empty fields returned errors without changing the list. Test records ${first.name} and ${second.name} remain in the database.`
      };
    })
};
