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
  
  const gamesHtml = results.map(({ id, data }) => {
    const { name, description, code, screenshot } = data;
    return `<li id="game-${id}" data-code="${code}">
              <img src="${screenshot}" />
              <b>${name}</b>${description}
            </li>`;
  });

  return gamesHtml.join('\n');
}

function loadGame(event) {
  console.log(event);
}
