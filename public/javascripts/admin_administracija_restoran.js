function obrisiArtikal(id){
    $.ajax({
        url: '/delete/artikal/' + id,
        method: 'DELETE',
        success: function () {
            str = 'artikal' + id;
            var za_brisanje = document.getElementById(str);
            za_brisanje.remove();
        }
    });
}

function postaviAkcijuArtikal(id, stanje){
    $.ajax({
        url: '/update/artikal/akcija/' + id,
        method: 'PUT',
        data: {stanje: stanje},
        success: function () {
            location.reload();
        }
    });
}