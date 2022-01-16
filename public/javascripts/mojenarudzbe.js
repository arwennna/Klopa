
function ocijeniNarudzbu(ocjena, red) {

    $.ajax({
        url: '/update/narudzba/ocijeni',
        method: 'PUT',
        data: {
            ocjena: ocjena,
            id: red
        },
        success: function () {
            for (let i=1; i<=5; i++) {
                let id = 'zvjezdica' + i + red;
                let zvjezdica = document.getElementById(id);
                zvjezdica.style.color = 'black';
            }
            for (let i=1; i<=ocjena; i++) {
                let id = 'zvjezdica' + i + red;
                let zvjezdica = document.getElementById(id);
                zvjezdica.style.color = 'orange';
            }

        }
    });
}