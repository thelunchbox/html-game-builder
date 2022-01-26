function makeCanvas (root, options = {}) {
  const { width = 1600, height = 896 } = options;
  const canvas = document.createElement('canvas');
  canvas.classList.add('main');
  canvas.width = width;
  canvas.height = height;
  root.appendChild(canvas);
  return [canvas];
}

async function loadSVGRaw(source) {
  const response = await fetch(source, {
    method: 'GET', // *GET, POST, PUT, DELETE, etc.
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers: {
      'Content-Type': 'text/plain'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
  });
  return response.text();
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = source;
    image.onload = e => {
      resolve(image);
    };
    image.onerror = e => {
      reject(e);
    };
  });
}