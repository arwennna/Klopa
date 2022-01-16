var express = require('express');
var router = express.Router();

//--------------------------------------------------Konfiguracija-----------------------------------------------------//

const naslov = "KLOPA";

var passport = require('passport');
var pool = require('../konfig/konfig_baza');

var inicijaliziraj = require('../konfig/konfig_passport');
inicijaliziraj(passport);

var {
  nije_autentificiran,
  super_admin,
  admin,
  dostavljac,
  kupac,
  udaljenostLatLong,
  formatirajDatum} = require('../funkcije/pomocne');

var io = null;

//--------------------------------------------------Opšta glavna------------------------------------------------------//

router.get('/', nije_autentificiran, function(req, res, next) {
  var tip = req.user.korisnik_tip;
  var uloga;
  switch (tip) {
    case 1:
      uloga = 'superadmin';
      break;
    case 2:
      uloga = 'admin';
      break;
    case 3:
      uloga = 'dostavljac';
      break;
    case 4:
      uloga = 'kupac';
      break;
  }
  var putanja = '/glavna/' + uloga;
  res.redirect(putanja);
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Superadmin glavna-------------------------------------------------//

router.get('/superadmin', nije_autentificiran, super_admin, function(req, res, next) {
  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT * FROM restoran
                    INNER JOIN restoran_tip_lookup ON
                    restoran.restoran_tip = restoran_tip_lookup.restoran_tip_lookup_id`,
        [], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
            res.render('superadmin/superadmin_glavna.ejs', { title: naslov, korisnik: req.user, restorani: result.rows });
          }
        });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Superadmin pregled narudžbi---------------------------------------//

router.get('/superadmin/narudzbe', nije_autentificiran, super_admin, function(req, res, next) {
    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`
                    SELECT * FROM narudzba
                    INNER JOIN korisnik on korisnik_id = narudzba_dostavljac
                    INNER JOIN restoran on restoran_id = narudzba_restoran
                    ORDER BY narudzba_datum DESC;`,
            [], function(err, result) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    res.render('superadmin/superadmin_narudzbe.ejs', {title: naslov, narudzbe: result.rows, formatirajDatum: formatirajDatum});
                }
            });
    });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Admin glavna------------------------------------------------------//

router.get('/admin', nije_autentificiran, admin, function(req, res, next) {
  var admn = req.user.korisnik_id;
  //var io = require("socket.io")(req.socket.server);
  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT * FROM restoran 
                  INNER JOIN restoran_tip_lookup ON restoran_tip = restoran_tip_lookup.restoran_tip_lookup_id
                  WHERE restoran_admin = $1; `,
        [admn], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
              res.render('admin/admin_glavna.ejs', { title: naslov, korisnik: req.user, restoran: result.rows });
          }
        });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Admin pregled narudžbi--------------------------------------------//

router.get('/admin/narudzbe', nije_autentificiran, admin, function(req, res, next) {

    let id = req.user.korisnik_id;

    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`
                    SELECT restoran_id FROM restoran
                    WHERE restoran_admin = $1;`,
            [id], function(err, results) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    let restoran = results.rows[0].restoran_id;
                    pool.connect(function(err, client, done) {
                        if (err) {
                            res.end('{"error" : "Error", "status" : 500}');
                        }
                        client.query(`
                        SELECT * FROM narudzba
                        INNER JOIN korisnik on korisnik_id = narudzba_dostavljac
                        INNER JOIN restoran on restoran_id = narudzba_restoran
                        WHERE narudzba_status = 0 AND restoran_id = $1
                        ORDER BY narudzba_datum DESC;`,
                            [restoran], function(err, result) {
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
                                            SELECT * FROM korisnik
                                            WHERE korisnik_tip = 3;`,
                                            [], function(err, results1) {
                                                done();
                                                if (err) {
                                                    console.info(err);
                                                    res.sendStatus(500);
                                                } else {
                                                    let dostavljaci = results1.rows;
                                                    console.log(dostavljaci);
                                                    res.render('admin/admin_narudzbe.ejs', {title: naslov, narudzbe: result.rows, formatirajDatum: formatirajDatum, dostavljaci: dostavljaci});
                                                }
                                            });
                                    });
                                }
                            });
                    });
                }
            });
    });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Admin izmjena narudžbi--------------------------------------------//

router.post('/admin/narudzbeEdit', nije_autentificiran, admin, function(req, res, next) {

    let dostavljac = req.body.dostavljac;
    let narudzba = req.body.narudzba;

    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`UPDATE narudzba
                      SET 
                      narudzba_dostavljac = $1
                      WHERE narudzba_id = $2;`, [dostavljac, narudzba], function(err, results) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    res.redirect('/glavna/admin/narudzbe');
                }
            });
    });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Dostavljač glavna-------------------------------------------------//

router.get('/dostavljac', nije_autentificiran, dostavljac, function(req, res, next) {

  let id = req.user.korisnik_id;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`
                    SELECT * FROM narudzba
                    INNER JOIN korisnik on korisnik_id = narudzba_kupac
                    INNER JOIN restoran on restoran_id = narudzba_restoran
                    WHERE narudzba_dostavljac = $1 AND narudzba_datum = CURRENT_DATE
                    ORDER BY narudzba_id;`,
        [id], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {

              if (!io) {
                  io = req.app.get('socketio');
                  const notificationNamespace = io.of('/notifikacija');
                  notificationNamespace.on('connection', function(client) {

                      client.on('notifikacija', function (d) {
                          notificationNamespace.emit('notifikacija_sa_servera', d);
                      });

                  });
              }

              res.render('dostavljac/dostavljac_glavna.ejs', {title: naslov, narudzbe: result.rows, korisnik: req.user, formatirajDatum: formatirajDatum});
          }
        });
  });
});

//--------------------------------------------------Kupac glavna------------------------------------------------------//

router.get('/kupac', nije_autentificiran, kupac, function(req, res, next) {
  var lat = req.user.korisnik_lat;
  var long = req.user.korisnik_long;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`
                    SELECT * FROM restoran
                    INNER JOIN restoran_tip_lookup ON
                    restoran.restoran_tip = restoran_tip_lookup.restoran_tip_lookup_id;`,
        [], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
              let restorani = [];
              for (let i = 0; i<result.rows.length; i++) {
                  let lat1 = result.rows[i].restoran_lat;
                  let long1 = result.rows[i].restoran_long;
                  let udaljenost = result.rows[i].restoran_udaljenost_dostave_km;
                  if (udaljenostLatLong(lat1, long1, lat, long) <= udaljenost*1000)
                      restorani.push(result.rows[i]);
              }
            res.render('kupac/kupac_glavna.ejs', { title: naslov, korisnik: req.user, restorani: restorani });
          }
        });
  });
});
//--------------------------------------------------------------------------------------------------------------------//


module.exports = router;
