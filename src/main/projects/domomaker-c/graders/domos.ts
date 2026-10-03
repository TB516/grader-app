import { randomUUID } from 'node:crypto';
import { Effect } from 'effect';
import type { GraderResult } from '../../../../shared/types';
import type { Grader } from '../../../types';
import { login, logout, readMaker, signup, testAccount } from '../accounts';
import { checkJsonError, checkJsonRedirect } from '../responses';
import { openSession, type Session } from '../session';

const checkDomos = Effect.fn(function* (session: Session, present: string[], absent: string[]) {
  const text = yield* readMaker(session);
  for (const name of present) {
    if (!text.includes(name)) return yield* Effect.fail<GraderResult>({ status: 'fail', message: `/maker did not display the saved Domo ${name}` });
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
      const names = Array.from({ length: 3 }, () => `Domo${randomUUID().slice(0, 8)}`);
      for (const [session, name, age] of [
        [first, names[0], '0'],
        [first, names[1], '5'],
        [second, names[2], '9']
      ] as const) {
        yield* checkJsonRedirect(yield* session.request('/maker', { name, age }), session.baseUrl, 'Create Domo');
      }
      yield* checkDomos(first, names.slice(0, 2), [names[2]]);
      yield* checkDomos(second, [names[2]], names.slice(0, 2));

      const invalidName = `Invalid${randomUUID().slice(0, 8)}`;
      for (const [step, fields] of [
        ['Missing name', { age: '3' }],
        ['Empty name', { name: '', age: '3' }],
        ['Missing age', { name: invalidName }],
        ['Empty age', { name: invalidName, age: '' }],
        ['Negative age', { name: invalidName, age: '-1' }],
        ['Non-numeric age', { name: invalidName, age: 'not-a-number' }]
      ] satisfies [string, Record<string, string>][]) {
        const before = yield* readMaker(first);
        yield* checkJsonError(yield* first.request('/maker', fields), `Create Domo: ${step}`);
        if ((yield* readMaker(first)) !== before) return { status: 'fail', message: `${step}: an invalid request changed the Domo list` };
      }

      yield* logout(first);
      yield* login(first, firstAccount);
      yield* checkDomos(first, names.slice(0, 2), [names[2], invalidName]);
      yield* checkDomos(second, [names[2]], names.slice(0, 2));
      yield* logout(second);
      yield* login(second, secondAccount);
      yield* checkDomos(second, [names[2]], names.slice(0, 2));
      yield* logout(first);
      yield* logout(second);
      return {
        status: 'pass',
        message: `Domos persist across login, stay isolated per account, and reject invalid fields. Test accounts ${firstAccount.username} and ${secondAccount.username} and their Domos remain in the database.`
      };
    })
};
