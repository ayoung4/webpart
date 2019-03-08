import { Either, Validation } from 'monet';
import * as Future from 'fluture';
import * as express from 'express';
import * as R from 'ramda';

interface IRequest {
    req: express.Request;
    res: express.Response;
    next: express.NextFunction;
}

type WebComputation = Future.FutureInstance<any, any>;
type WebResult = Either<any, WebComputation | any>

type Webpart = (req: IRequest) => WebResult;

// 400
const ok = (x) => Either.Right(Future.resolve(x));
const accept = (f: WebComputation) => Either.Right(f);

// 404
const reject = R.always(Either.Left({}));

// 4xx | 5xx
const fail = Future.reject({});

// append :: wp => wp => wp
export const append = (a: Webpart) => (b: Webpart) =>
    (req: IRequest) => b(req).bimap(
        reject,
        (wc: WebComputation) => wc.chain(
            () => a(req)
                .toMaybe()
                .orJust(fail),
        ),
    );

// match :: wp[] => wp
export const match = (wps: Webpart[]) =>
    (req: IRequest) => {
        const options = R.map(
            (wp) => wp(req),
            wps,
        );
        return R.find((wr) => wr.isRight(), options)
            || reject();
    };

// method :: str => wp
const method =
    (m: string) =>
        (request: IRequest) =>
            request.req.method === m
                ? ok(request)
                : reject();

export const GET = method('GET');
export const POST = method('POST');

// path :: str => wp
export const path =
    (p: string) =>
        (request: IRequest) =>
            p === request.req.path
                ? ok(request)
                : reject();
