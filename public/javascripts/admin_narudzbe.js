function promijeniDostavljaca(narudzba, dostavljacRed) {

    let str = 'dostavljac' + dostavljacRed;
    let noviDostavljac = document.getElementById(str).value;

    $.ajax({
        url: '/glavna/admin/narudzbeEdit',
        method: 'POST',
        data: {dostavljac: parseInt(noviDostavljac), narudzba: parseInt(narudzba)},
        success: function () {
            location.reload();
        }
    });
}