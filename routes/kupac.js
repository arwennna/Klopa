var express = require('express');
var router = express.Router();
var weather = require('openweather-apis');

//--------------------------------------------------Konfiguracija-----------------------------------------------------//

var nodemailer = require('nodemailer');

const naslov = "KLOPA";

var passport = require('passport');
var pool = require('../konfig/konfig_baza');

var inicijaliziraj = require('../konfig/konfig_passport');
inicijaliziraj(passport);

var {
  nije_autentificiran,
  kupac,
  porediPoPopularnosti,
  formatirajDatum} = require('../funkcije/pomocne');


var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'klopa.user1@gmail.com',
        pass: 'Administracija!123'
    },
    tls: {
        rejectUnauthorized: false
    }
});

weather.setLang('en');
weather.setCity('Sarajevo, BA');
weather.setUnits('metric');
weather.setAPPID('393f9f758cb2ab0af7786f986f0c6193');

//--------------------------------------------------Kupac-prikaz restorana--------------------------------------------//

router.get('/restoran/:id', nije_autentificiran, kupac, function(req, res, next) {

    let id = req.params.id;

    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`
                    SELECT * FROM restoran
                    INNER JOIN restoran_tip_lookup ON
                    restoran.restoran_tip = restoran_tip_lookup.restoran_tip_lookup_id
                    WHERE restoran.restoran_id = $1;`,
            [id], function(err, result) {
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    client.query(`
                    SELECT * FROM artikal
                    INNER JOIN artikal_tip_lookup ON
                    artikal.artikal_tip = artikal_tip_lookup.artikal_tip_lookup_id
                    WHERE artikal.artikal_restoran = $1;`,
                        [id], function(err, results) {
                            if (err) {
                                console.info(err);
                                res.sendStatus(500);
                            } else {

                                for (let i = 0; i< results.rows.length; i++) {
                                    console.log(results.rows[i].artikal_slika);
                                }

                                client.query(`
                              SELECT * FROM grupni_meni
                              WHERE grupni_meni.grupni_meni_restoran = $1;`,
                                    [id], function(err, results1) {
                                        if (err) {
                                            console.info(err);
                                            res.sendStatus(500);
                                        } else {
                                            let akcije = [];
                                            let najpopularniji = results.rows.sort(porediPoPopularnosti);
                                            if (najpopularniji.length >= 5) {
                                                najpopularniji = najpopularniji.slice(0, 5);
                                            }
                                            for (let i = 0; i < results.rows.length; i++) {
                                                if (results.rows[i].artikal_akcija)
                                                    akcije.push(results.rows[i]);
                                            }
                                            weather.getTemperature(function(err, temp){
                                                let temperatura = temp;
                                                let sezonski = [];
                                                for (let i = 0; i < results.rows.length; i++) {
                                                    if (temperatura >= 20) {
                                                        if (results.rows[i].artikal_specijalna_kategorija == 'Visoke temperature')
                                                            sezonski.push(results.rows[i]);
                                                    } else if (temperatura < 10) {
                                                        if (results.rows[i].artikal_specijalna_kategorija == 'Niske temperature')
                                                            sezonski.push(results.rows[i]);
                                                    }
                                                }
                                                res.render('kupac/kupac_restoran.ejs', { title: naslov, korisnik: req.user, restoran: result.rows[0], artikli: results.rows, meniji: results1.rows, akcije: akcije, najpopularniji: najpopularniji,
                                                    sezonski: sezonski, temperatura: temperatura});
                                            });
                                            done();
                                        }
                                    });
                            }
                        });
                }
            });
    });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Kupac-kreiranje narudžbe------------------------------------------//

router.post('/narudzba/kreiraj', nije_autentificiran, kupac, function(req, res, next) {

    let sadrzajNarudzbe = req.body.sadrzaj; //broj, naziv, cijena, tip
    let ukupnaCijena = req.body.ukupnaCijena;
    let korisnik = req.body.korisnik;
    let restoran = req.body.restoran;
    let vrijeme = req.body.vrijeme;
    let nacinPlacanja = req.body.nacinPlacanja;
    let datum = req.body.datum;

    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`
                      SELECT korisnik_id, count(narudzba_dostavljac) AS broj_narudzbi
                      FROM korisnik
                      LEFT JOIN narudzba ON korisnik.korisnik_id = narudzba.narudzba_dostavljac
                      WHERE korisnik_tip = 3
                      GROUP BY narudzba_dostavljac, korisnik_id
                      ORDER BY broj_narudzbi ASC;`,
            [], function(err, results1) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    let dostavljac = results1.rows[0].korisnik_id;

                    pool.connect(function(err, client, done) {
                        if (err) {
                            res.end('{"error" : "Error", "status" : 500}');
                        }
                        client.query(`INSERT INTO narudzba (narudzba_restoran, narudzba_cijena, narudzba_vrijeme_dostave, narudzba_kupac, narudzba_nacin_placanja, narudzba_datum, narudzba_dostavljac)
                                        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING narudzba_id;
                                    `, [restoran, ukupnaCijena, vrijeme, korisnik, nacinPlacanja, datum, dostavljac], function(err, result) {
                            done();
                            if (err) {
                                console.info(err);
                                res.sendStatus(500);
                            } else {
                                let idNarudzbe = result.rows[0].narudzba_id;
                                pool.connect(function(err, client, done) {
                                    if (err) {
                                        res.end('{"error" : "Error", "status" : 500}');
                                    }
                                    for (let i = 0; i<sadrzajNarudzbe.length; i++) {
                                        let nazivNarudzbe = sadrzajNarudzbe[i].naziv;
                                        let cijenaNarudzbe = sadrzajNarudzbe[i].cijena;
                                        client.query(`
                                         INSERT INTO narudzba_sadrzaj (narudzba_sadrzaj_naziv, narudzba_sadrzaj_cijena, narudzba_sadrzaj_broj_narudzbe)
                                         VALUES ($1, $2, $3)`,
                                            [nazivNarudzbe, cijenaNarudzbe, idNarudzbe], function(err, results) {

                                                if (i == sadrzajNarudzbe.length - 1) {
                                                    done();
                                                    if (err) {
                                                        console.info(err);
                                                        res.sendStatus(500);
                                                    } else {

                                                        pool.connect(function(err, client, done) {
                                                            if (err) {
                                                                res.end('{"error" : "Error", "status" : 500}');
                                                            }
                                                            client.query(`
                                                                            SELECT korisnik_mail FROM korisnik
                                                                            WHERE korisnik_id = $1;`,
                                                                [korisnik], function(err, resultMail) {
                                                                    done();
                                                                    if (err) {
                                                                        console.info(err);
                                                                        res.sendStatus(500);
                                                                    } else {
                                                                        let mail = resultMail.rows[0].korisnik_mail;
                                                                        let mailOptions = {
                                                                            from: 'klopa.user1@gmail.com',
                                                                            to: mail,
                                                                            subject: 'Klopa - narudžba',
                                                                            text: 'Vaša narudžba je uspješno spašena!'
                                                                        };

                                                                        transporter.sendMail(mailOptions, function(error, info){
                                                                            if (error) {
                                                                                console.log(error);
                                                                            } else {
                                                                                console.log('Email sent: ' + info.response);
                                                                            }
                                                                        });

                                                                        let url = '/kupac/restoran/' + restoran;
                                                                        res.redirect(url);
                                                                    }
                                                                });
                                                        });
                                                    }
                                                }
                                            });
                                    }
                                });
                            }
                        });
                    });
                }
            });
    });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Kupac-prikaz restorana--------------------------------------------//

router.get('/mojenarudzbe', nije_autentificiran, kupac, function(req, res, next) {

    let id = req.user.korisnik_id;

    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`
                    SELECT * FROM narudzba
                    INNER JOIN korisnik on korisnik_id = narudzba_kupac
                    INNER JOIN restoran on restoran_id = narudzba_restoran
                    INNER JOIN narudzba_sadrzaj on narudzba_sadrzaj_broj_narudzbe = narudzba_id
                    WHERE narudzba_kupac = $1
                    ORDER BY narudzba_id;`,
            [id], function(err, result) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    //console.log(result.rows);
                    let privremeni = result.rows;
                    let narudzbe = [];
                    let indeks = 0;

                    if (result.rows.length) {

                        let id_pom = privremeni[0].narudzba_id;
                        let obj_pom_prvi = {
                            narudzba_id: privremeni[0].narudzba_id,
                            narudzba_ocjena: privremeni[0].narudzba_ocjena,
                            narudzba_restoran: privremeni[0].narudzba_restoran,
                            narudzba_cijena: privremeni[0].narudzba_cijena,
                            narudzba_nacin_placanja: privremeni[0].narudzba_nacin_placanja,
                            narudzba_vrijeme_dostave: privremeni[0].narudzba_vrijeme_dostave,
                            narudzba_datum: formatirajDatum(privremeni[0].narudzba_datum),
                            narudzba_status: privremeni[0].narudzba_status,
                            narudzba_sadrzaj: [],
                            restoran_naziv: privremeni[0].restoran_naziv,
                            restoran_ulica: privremeni[0].restoran_ulica,
                            korisnik_ulica: privremeni[0].korisnik_ulica
                        }

                        let obj_pom_prvi_sadrzaj = {
                            narudzba_sadrzaj_id: privremeni[0].narudzba_sadrzaj_id,
                            narudzba_sadrzaj_naziv: privremeni[0].narudzba_sadrzaj_naziv,
                            narudzba_sadrzaj_cijena: privremeni[0].narudzba_sadrzaj_cijena,
                            narudzba_sadrzaj_broj_narudzbe: privremeni[0].narudzba_sadrzaj_broj_narudzbe
                        }

                        obj_pom_prvi.narudzba_sadrzaj.push(obj_pom_prvi_sadrzaj);
                        narudzbe.push(obj_pom_prvi);

                        for (let i = 1; i < privremeni.length; i++) {

                            let obj_pom_sadrzaj = {
                                narudzba_sadrzaj_id: privremeni[i].narudzba_sadrzaj_id,
                                narudzba_sadrzaj_naziv: privremeni[i].narudzba_sadrzaj_naziv,
                                narudzba_sadrzaj_cijena: privremeni[i].narudzba_sadrzaj_cijena,
                                narudzba_sadrzaj_broj_narudzbe: privremeni[i].narudzba_sadrzaj_broj_narudzbe
                            }

                            //Ako se radi o istoj narudžbi
                            if (privremeni[i].narudzba_id == id_pom) {
                                narudzbe[indeks].narudzba_sadrzaj.push(obj_pom_sadrzaj);
                            }
                            //Ako se radi o drugoj narudžbi
                            else {
                                let obj_pom = {
                                    narudzba_id: privremeni[i].narudzba_id,
                                    narudzba_ocjena: privremeni[i].narudzba_ocjena,
                                    narudzba_restoran: privremeni[i].narudzba_restoran,
                                    narudzba_cijena: privremeni[i].narudzba_cijena,
                                    narudzba_nacin_placanja: privremeni[i].narudzba_nacin_placanja,
                                    narudzba_vrijeme_dostave: privremeni[i].narudzba_vrijeme_dostave,
                                    narudzba_datum: formatirajDatum(privremeni[i].narudzba_datum),
                                    narudzba_status: privremeni[i].narudzba_status,
                                    narudzba_sadrzaj: [],
                                    restoran_naziv: privremeni[i].restoran_naziv,
                                    restoran_ulica: privremeni[i].restoran_ulica,
                                    korisnik_ulica: privremeni[i].korisnik_ulica
                                }
                                obj_pom.narudzba_sadrzaj.push(obj_pom_sadrzaj);
                                narudzbe.push(obj_pom);
                                indeks ++;
                                id_pom = privremeni[i].narudzba_id;
                            }
                        }
                    }
                    res.render('kupac/mojenarudzbe.ejs', {title: naslov, narudzbe: narudzbe, korisnik: req.user,});
                }
            });
    });
});

//--------------------------------------------------------------------------------------------------------------------//

module.exports = router;
