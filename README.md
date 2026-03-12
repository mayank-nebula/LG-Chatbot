export function proxy(req: NextRequest) {
  let pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/old-backup")) {
    pathname = pathname.replace("/old-backup", "");
  }

  if (urlMap[pathname]) {
    const destination = urlMap[pathname];
    const redirectUrl = new URL(destination, req.url);

    const shouldRedirect = [
      "/mediakit",
      "/media-kit",
      "/media-kit-full",
      "/media-kit-download-test",
    ].some((path) => pathname.startsWith(path));

    if (shouldRedirect) {
      return NextResponse.redirect(redirectUrl, { status: 302 });
    }

    return NextResponse.redirect(redirectUrl, {
      status: 301,
    });
  }

  const sessionId = req.cookies.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    const id = genUuid();
    const response = NextResponse.next();
    response.cookies.set({
      name: COOKIE_NAME,
      value: id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
    return response;
  }

  return NextResponse.next();
}
