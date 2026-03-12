export function proxy(req: NextRequest) {
  const originalPathname = req.nextUrl.pathname;
  let pathname = originalPathname;

  // 1. Strip out /old-backup
  if (pathname === "/old-backup" || pathname.startsWith("/old-backup/")) {
    pathname = pathname.replace("/old-backup", "") || "/";
  }

  // 2. Check urlMap
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

    return NextResponse.redirect(redirectUrl, { status: 301 });
  }

  // 3. Set up the base response
  // If the pathname was modified (meaning it had /old-backup), we redirect to the new valid endpoint.
  // Otherwise, we let Next.js continue normally.
  let response;
  if (originalPathname !== pathname) {
    const newUrl = req.nextUrl.clone();
    newUrl.pathname = pathname;
    response = NextResponse.redirect(newUrl, { status: 301 }); // Changes browser URL to /hello
  } else {
    response = NextResponse.next();
  }

  // 4. Handle Cookies (attaches to either the redirect response or the next() response)
  const sessionId = req.cookies.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    const id = genUuid();
    response.cookies.set({
      name: COOKIE_NAME,
      value: id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
  }

  return response;
}
