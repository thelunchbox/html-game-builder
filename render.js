function makeCanvas (root, options = {}) {
  const { width = 1600, height = 900 } = options;
  const canvas = document.createElement('canvas');
  canvas.classList.add('main');
  canvas.width = width;
  canvas.height = height;
  root.appendChild(canvas);

  const resizeCanvas = function () {
    const normalRatio = canvas.width / canvas.height;
    const newRatio = root.offsetWidth / root.offsetHeight;
    let scale = 1;
    let translate = '';
    if (newRatio < normalRatio) {
      // tall and skinny
      scale = root.offsetWidth / canvas.width;
      translate = ` translateX(${(scale * 100) - 100}%)`;
    } else if (newRatio >= normalRatio) {
      // short and fat
      scale = root.offsetHeight / canvas.height;
      translate = ` translateY(${(scale * 100) - 100}%)`;
    }
    canvas.style.transform = `scale(${scale}, ${scale})${translate}`;
  }

  window.addEventListener('resize', event => {
    resizeCanvas();
  });

  setTimeout(resizeCanvas, 10);

  return [canvas, resizeCanvas];
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