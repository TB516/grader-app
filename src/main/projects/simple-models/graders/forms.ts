import { load, type CheerioAPI } from 'cheerio';
import { Effect } from 'effect';
import type { GraderResult } from '../../../../shared/types';
import { contentTypeCheck } from '../../utils/content-type-check';
import { httpStatusCheck } from '../../utils/http-status-check';
import { projectUrl } from '../../utils/project-url';
import { request } from '../../utils/request';
import { responseText } from '../../utils/response-body';

type Field = 'name' | 'breed' | 'age';
type Selection = ReturnType<CheerioAPI>;

type FormSubmission = {
  action: URL;
  method: 'GET' | 'POST';
  encoding: string;
  defaults: [string, string][];
};

const findField = (page: CheerioAPI, form: Selection, field: Field) =>
  form
    .find('input, select, textarea')
    .filter((_index, element) => {
      const control = page(element);
      if (!control.attr('name') || control.is('[disabled], [type="hidden"], [type="submit"]')) return false;
      const id = control.attr('id');
      let label = '';
      if (id) {
        label = page('label')
          .filter((_index, label) => page(label).attr('for') === id)
          .text();
      }
      const description = [control.attr('name'), control.attr('id'), label, control.closest('label').text()]
        .join(' ')
        .replace(/([a-z])([A-Z])/gu, '$1 $2');
      return new RegExp(`\\b${field}\\b`, 'iu').test(description.replace(/[_-]/gu, ' '));
    })
    .first();

/** Load rendered HTML through the same scoped HTTP operations as the other graders. */
export const readPage = Effect.fn(function* (url: URL) {
  const response = yield* request(url);
  const failure = httpStatusCheck(response, 200) ?? contentTypeCheck(response, 'text/html');
  if (failure) return yield* Effect.fail({ ...failure, message: `${url.pathname}: ${failure.message}` });
  const html = yield* responseText(response, `${url.pathname}: HTML could not be read`);
  if (!html.trim()) return yield* Effect.fail<GraderResult>({ status: 'fail', message: `${url.pathname}: HTML body was empty` });
  return { page: load(html), url: new URL(response.url || url.href) };
});

const readSubmission = Effect.fn(function* (page: CheerioAPI, form: Selection, pageUrl: URL, fields: string[]) {
  const submit = form.find('button:not([type]), button[type="submit"], input[type="submit"]').not('[disabled]').first();
  const action = yield* Effect.try({
    try: () =>
      new URL(
        (submit.attr('formaction') ?? form.attr('action')) || pageUrl.href,
        new URL(page('base[href]').first().attr('href') || pageUrl.href, pageUrl)
      ),
    catch: (): GraderResult => ({ status: 'fail', message: 'A dog form has an invalid action URL' })
  });
  if (action.origin !== pageUrl.origin) {
    return yield* Effect.fail<GraderResult>({
      status: 'error',
      message: 'Cannot test a dog form that submits to another origin.',
      details: action.href
    });
  }
  const method = (submit.attr('formmethod') || form.attr('method') || 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'POST') {
    return yield* Effect.fail<GraderResult>({ status: 'fail', message: `A dog form uses the unsupported HTML form method ${method}` });
  }
  const defaults: [string, string][] = form
    .serializeArray()
    .filter(({ name }) => !fields.includes(name))
    .map(({ name, value }) => [name, value]);
  const submitName = submit.attr('name');
  if (submitName) defaults.push([submitName, submit.attr('value') || '']);
  const encoding = (submit.attr('formenctype') || form.attr('enctype') || 'application/x-www-form-urlencoded').toLowerCase();
  return { action, method, encoding, defaults } satisfies FormSubmission;
});

/** Discover routes and field names from page3; the rubric does not prescribe endpoint names. */
export const readDogForms = Effect.fn(function* (url: URL) {
  const { page, url: pageUrl } = yield* readPage(projectUrl(url, '/page3'));
  const forms = page('form')
    .toArray()
    .map((element) => {
      const form = page(element);
      return { form, name: findField(page, form, 'name'), breed: findField(page, form, 'breed'), age: findField(page, form, 'age') };
    });
  const creation = forms.filter(({ name, breed, age }) => name.length && breed.length && age.length);
  const lookup = forms.filter(({ name, breed, age }) => name.length && !breed.length && !age.length);
  if (!creation.length || !lookup.length) {
    return yield* Effect.fail<GraderResult>({
      status: 'fail',
      message: '/page3 needs a dog creation form with name, breed, and age, and a separate name lookup form'
    });
  }
  // Other starter forms may remain on the page. Prefer a form explicitly identifying dogs.
  const dogLookups = lookup.filter(({ form }) => /dog/iu.test(`${form.attr('action')} ${form.attr('id')} ${form.text()}`));
  const candidates = dogLookups.length ? dogLookups : lookup;
  if (creation.length !== 1 || candidates.length !== 1) {
    return yield* Effect.fail<GraderResult>({ status: 'error', message: 'Cannot identify the dog forms because /page3 has multiple matches.' });
  }
  const create = creation[0];
  const age = candidates[0];
  for (const input of [create.name, create.breed, age.name]) {
    if (!input.is('input') || (input.attr('type') || 'text').toLowerCase() !== 'text') {
      return yield* Effect.fail<GraderResult>({ status: 'fail', message: 'Dog name and breed fields must be text inputs' });
    }
  }
  if (!create.age.is('input[type="number"]')) {
    return yield* Effect.fail<GraderResult>({ status: 'fail', message: 'The dog age field must be a number input' });
  }
  const fields = { name: create.name.attr('name')!, breed: create.breed.attr('name')!, age: create.age.attr('name')! };
  const lookupName = age.name.attr('name')!;
  return {
    create: { submission: yield* readSubmission(page, create.form, pageUrl, Object.values(fields)), fields },
    age: { submission: yield* readSubmission(page, age.form, pageUrl, [lookupName]), name: lookupName }
  };
});

/** Submit the form as HTML would, preserving hidden fields and the chosen submit button. */
export const submitForm = Effect.fn(function* (form: FormSubmission, fields: Record<string, string>) {
  const data = new URLSearchParams(form.defaults);
  for (const [name, value] of Object.entries(fields)) data.set(name, value);
  const target = new URL(form.action);
  if (form.method === 'GET') {
    target.search = data.toString();
    return yield* request(target);
  }
  if (form.encoding === 'multipart/form-data') {
    const body = new FormData();
    for (const [name, value] of data) body.append(name, value);
    return yield* request(target, { method: 'POST', body });
  }
  if (form.encoding === 'text/plain') {
    return yield* request(target, {
      method: 'POST',
      body: [...data].map(([name, value]) => `${name}=${value}`).join('\r\n'),
      headers: { 'Content-Type': 'text/plain' }
    });
  }
  return yield* request(target, { method: 'POST', body: data });
});
