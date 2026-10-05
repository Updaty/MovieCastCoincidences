const options = {
method: 'GET',
headers: {accept: 'application/json', Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YTUwMjVlODBlZTA3MjcyNjk1YTdiODNmNjIzZjM3OCIsIm5iZiI6MTc5MTA0OTgwNy44MzYsInN1YiI6IjZhYzE0MDRmZWQ2Y2Q5MmFhMGQ2MjMzMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.61wEvclL85UE7Aafk6NmTnLo7xRxvZP8y8VsLLq2xYU'}
};

const search_cache = {};
const profile_cache = {};
const curr_movies = new Set();
let curr_cast = new Set();
const movie_cache = {};

const textToHtml = str => Array.from(str).map(c => c==="&"?"&amp":(c==="<"?"&lt;":(c===">"?"&gt;":c))).join("");

async function getCast(movie_id){
  

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
    if(!curr_movies.has(movie_id)){
      tableHead.firstChild.innerHTML += `<th><img src="${getImagePath(movie_cache[movie_id].poster_path)}" width=25> &nbsp;In <q>${movie_cache[movie_id].title}</q></th>`
      curr_movies.add(movie_id);
      movie_cache[movie_id].cast = cast;
      movie_cache[movie_id].cast_dict = {};
      const new_cast = new Set(cast.map(e => {movie_cache[movie_id].cast_dict[e.name] = e.character;profile_cache[e.name] = e.profile_path;return e.name}));
      curr_cast = curr_cast.size===0?new_cast:curr_cast.union(new_cast);
    }
    searchResults.innerHTML = "";
    tableData.innerHTML = "";
    for (const actor of curr_cast){
      let str = `<tr><td><img src="${getImagePath(profile_cache[actor])}" width=25><span> &nbsp;${textToHtml(actor)}</span></td>`;
      for (const movie of curr_movies) {
        str += `<td><span> &nbsp;${textToHtml(movie_cache[movie].cast_dict[actor] ?? "-")}</span></td>`;
      }
      tableData.innerHTML += str + "</tr>";
    }
  }
};

function getImagePath(path){
    if(path === null) path = "./person.webp";
    else path = "https://image.tmdb.org/t/p/w92"+path;
    return path;
}
async function searchMovies(){
  const query = searchbar.value;
  if(search_cache[query]){
    searchResults.innerHTML = search_cache[query].html;

    const list_items = document.querySelectorAll("#searchResults div");

    for (let i = 0; i < list_items.length; i++)
      list_items[i].onclick = await getCast(search_cache[query].results[i].id);
    return;
  }
  searchResults.innerHTML = "";
  const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${query}`, options);
  const results = (await response.json()).results.map(e => {
    return {id: e.id, poster_path: e.poster_path, title: e.title}
  });
  
  for (let i = 0; i < 5 && i < results.length; i++){
    searchResults.innerHTML += `<div><img src="${getImagePath(results[i].poster_path)}" width=25><span> &nbsp;${textToHtml(results[i].title)}</span></div>`;
    movie_cache[results[i].id] = {poster_path: results[i].poster_path, title:results[i].title};
  }
  const list_items = document.querySelectorAll("#searchResults div");
  
  for (let i = 0; i < list_items.length; i++) 
    list_items[i].onclick = await getCast(results[i].id);

  search_cache[query] = {html: searchResults.innerHTML, results};
}


searchButton.addEventListener('click',searchMovies)
searchbar.addEventListener('keypress',e => {if(e.key==="Enter") searchMovies()})