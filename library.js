let db;

function initializeDb() {
  db = firebase.firestore();
}

async function showLibrary(show) {
  const lib = document.querySelector('#library-panel');
  if (show) {
    lib.classList.add('show');
    document.querySelector('#library-list').innerHTML = await getGames();
  } else {
    lib.classList.remove('show');
  }
}

async function getGames() {
  const results = await db.collection('games').get();

  const gamesHtml = [];
  results.forEach(record => {
    const { id, data } = record;
    const code = record.get('code');
    const screenshot = record.get('screenshot');
    const author = record.get('author');
    const name = record.get('name');
    const description = record.get('description');
    gamesHtml.push(`<li id="game-${id}" data-code="${code}">
        <img src="${screenshot}" />
        <div>
          <b>${name}</b>
          <b>by ${author}</b>
          <i>${description}</i>
        </div>
      </li>`);
  });

  return gamesHtml.join('\n');
}

async function saveGame(game) {
  try {
    await db.collection('games').add(game);
    showLibrary(true);
  } catch (ex) {
    alert(`Could not upload game: ${e.message}`);
  }
}

function loadGame(element) {
  const code = element.getAttribute('data-code');
  if (code) {
    finishImport(code);
    showLibrary(false);
  } else {
    if (element.parentElement != document.body)
      loadGame(element.parentElement);
  }
}