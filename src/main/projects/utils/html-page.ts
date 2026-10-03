import { load } from 'cheerio';
import { Effect, Result } from 'effect';
import type { Grader } from '../../types';
import { contentTypeCheck } from './content-type-check';
import { responseDetails } from './details';
import { httpStatusCheck } from './http-status-check';
import { projectUrl } from './project-url';
import { request } from './request';
import { responseText } from './response-body';

type HtmlPageGraderOptions = {
  label: string;
  path: string;
  passMessage: string;
  resource?: { selector: string; attribute: 'src' | 'href'; path: string };
};

/** Check rendered HTML and any media or stylesheet that the assignment requires it to load. */
export const htmlPageGrader = ({ label, path, passMessage, resource }: HtmlPageGraderOptions): Grader => ({
  label,
  run: (url) =>
    Effect.gen(function* () {
      const response = yield* request(projectUrl(url, path));

      let failure = httpStatusCheck(response, 200);
      if (failure) return failure;

      failure = contentTypeCheck(response, 'text/html');
      if (failure) return failure;

      const text = yield* responseText(response, 'Text parsing failed');
      if (!text.trim()) return { status: 'fail', message: 'HTML body was empty', details: responseDetails(response) };

      if (resource) {
        const page = load(text);
        const pageUrl = new URL(response.url || projectUrl(url, path));
        const base = Result.try(() => new URL(page('base[href]').first().attr('href') || pageUrl.href, pageUrl));
        const expected = new URL(projectUrl(url, resource.path).pathname, pageUrl);
        const sources = page(resource.selector).toArray();
        const linked =
          Result.isSuccess(base) &&
          sources.some((element) => {
            const source = Result.try(() => new URL(page(element).attr(resource.attribute)!, base.success));
            return Result.isSuccess(source) && source.success.origin === expected.origin && source.success.pathname === expected.pathname;
          });
        if (!linked) return { status: 'fail', message: `${path} must load ${resource.path} through the required HTML element` };
      }

      return { status: 'pass', message: passMessage, details: responseDetails(response) };
    })
});
