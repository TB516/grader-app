import { randomUUID } from 'node:crypto';
import { Effect } from 'effect';
import type { GraderResult } from '../../../../shared/types';
import type { Grader } from '../../../types';
import { login, logout, readMaker, signup, testAccount } from '../accounts';
import { checkJsonError, checkJsonRedirect } from '../responses';
import { openSession, type Session } from '../session';

type Domo = { name: string; age: string };

const checkDomos = Effect.fn(function* (session: Session, present: Domo[], absent: string[]) {
  const page = yield* readMaker(session);
  const text = page('body').text();
  for (const domo of present) {
    if (!text.includes(domo.name))
      return yield* Effect.fail<GraderResult>({ status: 'fail', message: `/maker did not display the saved Domo ${domo.name}` });
    // Find a containing element with this Domo's name and age, without assuming CSS classes.
    const others = present.filter((other) => other !== domo);
    const ageShown = page('body *')
      .toArray()
      .some((element) => {
        const item = page(element).text();
        if (!item.includes(domo.name) || others.some((other) => item.includes(other.name))) return false;
        const age = /\bage\s*[:=]?\s*([+-]?\d+(?:\.\d+)?)/iu.exec(item.replaceAll(domo.name, ''));
        return age !== null && Number(age[1]) === Number(domo.age);
      });
    if (!ageShown) return yield* Effect.fail<GraderResult>({ status: 'fail', message: `/maker did not display age ${domo.age} for ${domo.name}` });
  }
  for (const name of absent) {
    if (text.includes(name))
      return yield* Effect.fail<GraderResult>({
        status: 'fail',
        message: `/maker displayed Domo ${name} from an invalid request or another account`
      });
  }
});

export const domosGrader: Grader = {
  label: 'Domo Creation, Validation, Persistence, And Account Isolation',
  run: (url) =>
    Effect.gen(function* () {
      const first = yield* openSession(url);
      const second = yield* openSession(url);
      const firstAccount = testAccount();
      const secondAccount = testAccount();
      yield* signup(first, firstAccount);
      yield* signup(second, secondAccount);
      const empty = (yield* readMaker(first))('body').text();
      if (!/\b(?:no|zero|0)\s+domos?\b|\bempty\b|\b(?:first|any)\s+domo\b/iu.test(empty)) {
        return { status: 'fail', message: '/maker did not show a message explaining that the new account has no Domos' };
      }
      const domos = ['0', '5', '9'].map((age) => ({ name: `Domo${randomUUID().slice(0, 8)}`, age }));
      const names = domos.map((domo) => domo.name);
      for (const [session, domo] of [
        [first, domos[0]],
        [first, domos[1]],
        [second, domos[2]]
      ] as const) {
        yield* checkJsonRedirect(yield* session.request('/maker', domo), session.baseUrl, 'Create Domo');
      }
      yield* checkDomos(first, domos.slice(0, 2), [names[2]]);
      yield* checkDomos(second, [domos[2]], names.slice(0, 2));

      const invalidName = `Invalid${randomUUID().slice(0, 8)}`;
      for (const [step, fields] of [
        ['Missing name', { age: '3' }],
        ['Empty name', { name: '', age: '3' }],
        ['Missing age', { name: invalidName }],
        ['Empty age', { name: invalidName, age: '' }],
        ['Negative age', { name: invalidName, age: '-1' }],
        ['Non-numeric age', { name: invalidName, age: 'not-a-number' }]
      ] satisfies [string, Record<string, string>][]) {
        const before = (yield* readMaker(first))('body').text();
        yield* checkJsonError(yield* first.request('/maker', fields), `Create Domo: ${step}`);
        if ((yield* readMaker(first))('body').text() !== before)
          return { status: 'fail', message: `${step}: an invalid request changed the Domo list` };
      }

      yield* logout(first);
      yield* login(first, firstAccount);
      yield* checkDomos(first, domos.slice(0, 2), [names[2], invalidName]);
      yield* checkDomos(second, [domos[2]], names.slice(0, 2));
      yield* logout(second);
      yield* login(second, secondAccount);
      yield* checkDomos(second, [domos[2]], names.slice(0, 2));
      yield* logout(first);
      yield* logout(second);
      return {
        status: 'pass',
        message: `Domos persist across login, stay isolated per account, and reject invalid fields. Test accounts ${firstAccount.username} and ${secondAccount.username} and their Domos remain in the database.`
      };
    })
};
