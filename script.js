const options = {
method: 'GET',
headers: {accept: 'application/json', Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YTUwMjVlODBlZTA3MjcyNjk1YTdiODNmNjIzZjM3OCIsIm5iZiI6MTc5MTA0OTgwNy44MzYsInN1YiI6IjZhYzE0MDRmZWQ2Y2Q5MmFhMGQ2MjMzMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.61wEvclL85UE7Aafk6NmTnLo7xRxvZP8y8VsLLq2xYU'}
};

const search_cache = {};
const profile_cache = {};
const page_cache = [];
const curr_movies = [];
let curr_cast = new Set();
const MAX_PAGE_AMOUNT = 4;
const movie_cache = {};
let curr_page = 0;
let curr_page_amount = MAX_PAGE_AMOUNT;
let curr_query = '';

const textToHtml = str => Array.from(str).map(c => c==="&"?"&amp":(c==="<"?"&lt;":(c===">"?"&gt;":c))).join("");

function addRemoveButtonsEvent(){
  const remove_buttons = document.getElementsByClassName('remove');

  for (let i = 0; i < remove_buttons.length; i++) {
    remove_buttons[i].onclick = () => {
      curr_movies.splice(i,1);
      const tr_to_remove = [];
      Array.from(document.getElementsByTagName('tr')).forEach(e => {
        const actor_name = e.firstChild.innerText.trim();
        if(actor_name !== 'Actor' && curr_movies.reduce((pre, cur) => movie_cache[cur].cast_dict[actor_name] ? pre+1 : pre, 0) == 0)
          tr_to_remove.push(e);
        e.removeChild(e.children[i+1]);
      });
      tr_to_remove.forEach(e => tableData.removeChild(e));
      if(remove_buttons.length === 0) {
        tableMain.style.display = "none";
        return;
      }
      if(i !== remove_buttons.length)
        addRemoveButtonsEvent();
    }; 
  }
}

function fillInTableData(){
  searchResults.innerHTML = "";
  searchPages.style.display = "none";
  searchResults.style.display = "none";
  tableData.innerHTML = "";
  const actor_occur_map = Object.create(null);
  
  for (const actor of curr_cast){
    let str = `<td><img src="${getImagePath(profile_cache[actor])}" width=25><span> &nbsp;${textToHtml(actor)}</span></td>`;
    let count = 0;
    for (const movie of curr_movies) {
      const character_name = movie_cache[movie].cast_dict[actor];
      count += Boolean(character_name);
      str += `<td><span> &nbsp;${textToHtml(character_name ?? "-")}</span></td>`;
    }
    
    if(Boolean(actor_occur_map[count]))
      actor_occur_map[count].push(str);
    else
      actor_occur_map[count] = [str];
    
  }
  
  const counts = Object.keys(actor_occur_map);
  
  for (let i = counts.length - 1; i >= 0; i--) {
    const start_tr = (counts[i] === 1) ? "<tr class=cool>" : "<tr>";
    
    for (const str of actor_occur_map[counts[i]])
      tableData.innerHTML += start_tr + str + "</tr>";
  }
}

function getCast(movie_id){
  return async() => {
    let cast;
    if(movie_cache[movie_id].cast){
      cast = movie_cache[movie_id].cast;
    }else{
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}/credits?language=en-US`, options)
      const data = await response.json();
      cast = data.cast.map(e => {
        return {character: e.character, profile_path: e.profile_path, name: e.name}
      });
    }
    
    tableMain.style.display = "block";
    if(!curr_movies.includes(movie_id)){
      tableHead.firstChild.innerHTML += `<th><img src="${getImagePath(movie_cache[movie_id].poster_path)}" width=25> &nbsp;In <q>${movie_cache[movie_id].title}</q><button class=remove>-</button</th>`
      curr_movies.push(movie_id);
      movie_cache[movie_id].cast = cast;
      movie_cache[movie_id].cast_dict = {};
      const new_cast = new Set(cast.map(e => {movie_cache[movie_id].cast_dict[e.name] = e.character;profile_cache[e.name] = e.profile_path;return e.name}));
      curr_cast = curr_cast.size===0?new_cast:curr_cast.union(new_cast);
    }
    
    fillInTableData();
    
    addRemoveButtonsEvent();
  }
};

function getImagePath(path){
  if(path === null) path = "./person.webp";
  else path = "https://image.tmdb.org/t/p/w92"+path;
  return path;
}

function attachListenersToSearchResults(){
  const list_items = document.querySelectorAll("#searchResults div");
  
  for (let i = 0; i < list_items.length; i++)
    list_items[i].onclick = getCast(search_cache[curr_query].results[i + curr_page*3].id);
}

function showCurrSearchPage(){
  searchResults.style.display = "block";
  searchResults.innerHTML = search_cache[curr_query].html[curr_page];

  attachListenersToSearchResults();
}

async function searchMovies(){
  if(!(searchbar.value)) return;
  curr_query = searchbar.value;
  curr_page = 0;
  searchPages.style.display = "flex";
  if(search_cache[curr_query]){
    showCurrSearchPage();

    attachListenersToSearchResults();
    return;
  }
  searchResults.innerHTML = "";
  const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${curr_query}`, options);
  const results = (await response.json()).results.map(e => {
    return {id: e.id, poster_path: e.poster_path, title: e.title}
  });
  searchResults.style.display = "block";
  if(results.length === 0){
    searchResults.innerHTML = "-";
    searchPages.style.display = "none";
    return;
  }
  
  curr_page_amount = Math.min(MAX_PAGE_AMOUNT, Math.ceil(results.length/3))
  searchPages.innerHTML = '';
  if(curr_page_amount > 1) {
    searchPages.innerHTML = page_cache[curr_page_amount-1];
  }

  const pages = Array(curr_page_amount).fill("");
  
  const overflow = Math.max(0, curr_page_amount*3 - results.length + 1) || 3;
  
  for (let j = 0; j < curr_page_amount; j++) {
    for (let i = 0; i < (j==curr_page_amount-1? overflow : 3) && i < results.length; i++){
      const result = results[i+j*3];
      pages[j] += `<div><img src="${getImagePath(result.poster_path)}" width=25><span> &nbsp;${textToHtml(result.title)}</span></div>`;
      movie_cache[result.id] = {poster_path: result.poster_path, title:result.title};
    }
  }
  search_cache[curr_query] = {html: pages, results};
  
  showCurrSearchPage();

}


searchButton.addEventListener('click',searchMovies)
searchbar.addEventListener('keypress',e => {if(e.key==="Enter") searchMovies()})
const pageEventListeners = [];
for (let i = 0; i < MAX_PAGE_AMOUNT; i++) {
  pageEventListeners.push(() => {
    searchPages.children[curr_page+1].className = '';
    curr_page = i;
    searchPages.children[i+1].className = 'curr';
    showCurrSearchPage();
  });
  let pages_html = '<a></a>';
  for (let j = 1; j <= i + 1; j++)
    pages_html += `<a ${j==1?"class=curr":""} onclick=pageEventListeners[${j-1}]()>${j}</a>`;
  
  pages_html += '<a></a>';
  page_cache.push(pages_html);
}