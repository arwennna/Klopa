const lista = document.getElementById('restoraniLista');
const searchBar = document.getElementById('search_restaurants');
searchBar.addEventListener('keyup', function(e) {
    const sadrzaj = e.target.value.toLowerCase();
    const restorani = lista.getElementsByTagName('li');
    Array.from(restorani).forEach(function(restoran) {
        const nazivRestorana = restoran.children[0].children[0].children[0].children[1].children[0].textContent;
        const tipRestorana = restoran.children[0].children[0].children[0].children[1].children[1].textContent;
        console.log(nazivRestorana);
        if (nazivRestorana.toLowerCase().indexOf(sadrzaj) != -1 || tipRestorana.toLowerCase().indexOf(sadrzaj) != -1) {
            restoran.style.display = 'block';
        } else {
            restoran.style.display = 'none';
        }
    });
});
