import { NextResponse } from "next/server";

export type ApiOk<T> = { ok: true } & T;
export type ApiErr = { ok: false; error: string };
export type ApiResult<T = object> = ApiOk<T> | ApiErr;

export function ok<T extends object = object>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function err(message: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function unauthorized(): NextResponse {
  return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
}
