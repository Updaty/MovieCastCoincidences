const options = {
method: 'GET',
headers: {accept: 'application/json', Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5YTUwMjVlODBlZTA3MjcyNjk1YTdiODNmNjIzZjM3OCIsIm5iZiI6MTc5MTA0OTgwNy44MzYsInN1YiI6IjZhYzE0MDRmZWQ2Y2Q5MmFhMGQ2MjMzMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.61wEvclL85UE7Aafk6NmTnLo7xRxvZP8y8VsLLq2xYU'}
};



async function getCast(movie_id){
  const response = await fetch(`https://api.themoviedb.org/3/movie/${movie_id}/credits?language=en-US`, options)
  const data = await response.json();
  const {cast} = data;
  return () => {
    tableMain.style.display = "block";
    searchResults.innerHTML = "";
    for (const actor of cast) {
      const tablerow = document.createElement("tr");
      tabledata.appendChild(tablerow);

      const name_cell = document.createElement("td");
      tablerow.appendChild(name_cell);
      name_cell.appendChild(getImage(actor.profile_path));
      name_cell.appendChild(document.createTextNode(' '+actor.name));
      
      const character_cell = document.createElement("td");
      character_cell.innerText = actor.character;
      tablerow.appendChild(character_cell);
    }
  };
}
function getImage(path){
    if(path==null) path = "./person.webp";
    else path = "https://image.tmdb.org/t/p/w92"+path;
    const img = new Image(25);
    img.src = path;
    return img;
}
async function searchMovies(){
    searchResults.innerHTML = "";
    const query = searchbar.value;
   const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${query}`, options);
   const data = await response.json();
   for (let i = 0; i < 5 && i < data.results.length; i++) {
    const list_item = document.createElement("div");
    
    searchResults.appendChild(list_item);
    
    try{list_item.appendChild(getImage?.(data.results[i].poster_path))}catch{};
    
    const text = document.createElement("span");
    text.innerText = ' '+data.results[i].title;
    list_item.appendChild(text);
    
    list_item.onclick = await getCast(data.results[i].id);
   }
}

searchMovies()

searchButton.addEventListener('click',searchMovies)
searchbar.addEventListener('keypress',e => {if(e.key==="Enter") searchMovies()})