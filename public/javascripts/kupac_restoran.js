

const listaArtikli = document.getElementById('listaArtikala');
const searchBarArtikli = document.getElementById('search_products');
searchBarArtikli.addEventListener('keyup', function(e) {
    const sadrzaj = e.target.value.toLowerCase();
    console.log(sadrzaj);
    const artikli = listaArtikli.getElementsByTagName('li');
    console.log(artikli.length);
    Array.from(artikli).forEach(function(artikal) {
        const nazivArtikla = artikal.children[0].children[1].children[0].children[1].children[0].children[0].textContent;
        const tipArtikla = artikal.children[0].children[1].children[0].children[1].children[1].children[0].textContent;
        if (nazivArtikla.toLowerCase().indexOf(sadrzaj) != -1 || tipArtikla.toLowerCase().indexOf(sadrzaj) != -1) {
            artikal.style.display = 'block';
        } else {
            artikal.style.display = 'none';
        }
    });
});

let narudzba = [];
let brojac = 1;
let cijenaUkupno = 0;

let trenutno = new Date();
trenutno.setHours(trenutno.getHours() + 2);
document.getElementById('vrijemeDostave').valueAsDate = trenutno;

function dodajArtikalNarudzba(artikalNaziv, artikalCijena, artikalAkcija, artikalCijenaAkcija) {

    if (artikalAkcija) {
        var noviArtikal = {
            broj: brojac,
            naziv: artikalNaziv,
            cijena: artikalCijenaAkcija,
            tip: 0
        }
        cijenaUkupno += parseInt(artikalCijenaAkcija);
    } else {
        var noviArtikal = {
            broj: brojac,
            naziv: artikalNaziv,
            cijena: artikalCijena,
            tip: 0
        }
        cijenaUkupno += parseInt(artikalCijena);
    }

    narudzba.push(noviArtikal);
    dodajRed("tabela-narudzbe", noviArtikal);
    brojac += 1;

}

function dodajMeniNarudzba(meniNaziv, meniCijena) {

    let noviMeni = {
        broj: brojac,
        naziv: meniNaziv,
        cijena: meniCijena,
        tip: 1
    }

    narudzba.push(noviMeni);
    cijenaUkupno += parseInt(meniCijena);
    dodajRed("tabela-narudzbe", noviMeni);
    brojac += 1;

}

function dodajRed(tabela, noviRed) {

    podesiCijenu(cijenaUkupno);

    let tabelaRef = document.getElementById(tabela);
    let noviRedRef = tabelaRef.insertRow(-1);
    noviRedRef.id = 'red' + noviRed.broj;

    let prvaCelija = noviRedRef.insertCell(0);
    let prvaCelijaTekst = document.createTextNode(noviRed.naziv);
    prvaCelija.appendChild(prvaCelijaTekst);

    let drugaCelija = noviRedRef.insertCell(1);
    let drugaCelijaTekst = document.createTextNode(noviRed.cijena);
    drugaCelija.appendChild(drugaCelijaTekst);

    let dugmeBrisanje = document.createElement("button");
    dugmeBrisanje.innerHTML = "Ukloni";
    dugmeBrisanje.id = noviRed.broj;
    let id = dugmeBrisanje.id;

    dugmeBrisanje.onclick = function() {
        obrisiRed(id);
        narudzbaFilter = narudzba.filter(function(e) { return e.broj != id });
        narudzba = narudzbaFilter;
        cijenaUkupno -= parseInt(noviRed.cijena);
        podesiCijenu(cijenaUkupno);
    }

    let trecaCelija = noviRedRef.insertCell(2);
    trecaCelija.appendChild(dugmeBrisanje);

}

function obrisiRed(id) {
    let red = 'red' + id;
    var zaBrisanje = document.getElementById(red);
    zaBrisanje.remove();
}

function podesiCijenu(cijenaTrenutna) {
    let cijenaRef = document.getElementById('cijenaVrij');
    cijenaRef.innerText = cijenaTrenutna;
}

function zatvoriModal() {
    document.getElementById('vrijemeDostave').valueAsDate = new Date();
}

function danasnjiDatum() {
    return new Date(Date.now()).toISOString().replace('T',' ').replace('Z','');
}

function finalizirajNarudzbu(korisnik, restoran) {
    let vrijeme = document.getElementById('vrijemeDostave').value;
    let nacinPlacanja = document.getElementById('nacinPlacanja').value;
    let datum = danasnjiDatum();
    document.getElementById('vrijemeDostave').valueAsDate = new Date();
    saljiUpit(korisnik, restoran, vrijeme, nacinPlacanja, datum);
}

function saljiUpit(korisnik, restoran, vrijeme, nacinPlacanja, datum){
    $.ajax({
        url: '/kupac/narudzba/kreiraj',
        method: 'POST',
        data: {sadrzaj: narudzba, ukupnaCijena: cijenaUkupno, korisnik: korisnik, restoran: restoran, vrijeme: vrijeme, nacinPlacanja: nacinPlacanja, datum: datum},
        success: function () {
            location.reload();
        }
    });
}