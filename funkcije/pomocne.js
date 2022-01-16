var pool = require('../konfig/konfig_baza');

function jeste_autentificiran(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/glavna');
    }
    next();
}

function nije_autentificiran(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/prijava');
}

function ima_adresu(req, res, next) {
    //console.log(req.korisnik_tip);
    if (req.user.korisnik_long == null) {
        return next();
    }
    res.redirect('/mojprofil');
}

function super_admin(req, res, next) {
    //console.log(req.korisnik_tip);
    if (req.user.korisnik_tip == 1) {
        return next();
    }
    res.redirect('/glavna');
}

function adminplus(req, res, next) {
    if (req.user.korisnik_tip == 2 || req.user.korisnik_tip == 1) {
        return next();
    }
    res.redirect('/glavna');
}

function admin(req, res, next) {
    //console.log(req.korisnik_tip);
    if (req.user.korisnik_tip == 2) {
        return next();
    }
    res.redirect('/glavna');
}

function dostavljac(req, res, next) {
    //console.log(req.korisnik_tip);
    if (req.user.korisnik_tip == 3) {
        return next();
    }
    res.redirect('/glavna');
}

function kupac(req, res, next) {
    //console.log(req.korisnik_tip);
    if (req.user.korisnik_tip == 4) {
        return next();
    }
    res.redirect('/glavna');
}

function chat(req, res, next) {
    if (req.user.korisnik_tip == 1 || req.user.korisnik_tip == 4) {
        return next();
    }
    res.redirect('/glavna');
}

//https://www.movable-type.co.uk/scripts/latlong.html
function udaljenostLatLong(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c;
    return d;
}

function porediPoPopularnosti(a, b) {
    if (a.artikal_popularnost > b.artikal_popularnost){
        return -1;
    }
    if (a.artikal_popularnost < b.artikal_popularnost){
        return 1;
    }
    return 0;
}

function formatirajDatum(date) {
    let d = new Date(date);
    return [
        ('0' + d.getDate()).slice(-2),
        ('0' + (d.getMonth() + 1)).slice(-2),
        d.getFullYear(),
        ''
    ].join('.');
}

module.exports = {
    jeste_autentificiran,
    nije_autentificiran,
    ima_adresu,
    super_admin,
    admin,
    adminplus,
    dostavljac,
    kupac,
    chat,
    udaljenostLatLong,
    porediPoPopularnosti,
    formatirajDatum
}