export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname === '/duong-dan-cu') {
    return Response.redirect(new URL('/duong-dan-moi', request.url), 301);
  }
  
  if (url.pathname === '/fb') {
    return Response.redirect('https://facebook.com', 301);
  }

  if (url.pathname.includes('.')) {
    return next();
  }

  const assetUrl = new URL('/index.html', request.url);
  return fetch(assetUrl);
}
