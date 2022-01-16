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
  adminplus
} = require('../funkcije/pomocne');

//--------------------------------------------------Administracija----------------------------------------------------//

router.get('/', nije_autentificiran, adminplus, function(req, res, next) {
  let tip = req.user.korisnik_tip;
  let str = '_administracija';
  if (tip == 1)
      str = 'superadmin/superadmin' + str + '.ejs';
  else if (tip == 2)
      str = 'admin/admin' + str + '.ejs';
  res.render(str, {korisnik: req.user, title: naslov});
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Administracija restorani (superadmin)-----------------------------//

router.get('/restorani', nije_autentificiran, super_admin, function(req, res, next) {
  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT * FROM restoran 
                  INNER JOIN restoran_tip_lookup ON
                  restoran_tip_lookup.restoran_tip_lookup_id = restoran_tip`,
        [], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
              let restorani = result.rows;
              pool.connect(function(err, client, done) {
                  if (err) {
                      res.end('{"error" : "Error", "status" : 500}');
                  }
                  client.query(`SELECT * FROM restoran_tip_lookup`,
                      [], function(err, result1) {
                          done();
                          if (err) {
                              console.info(err);
                              res.sendStatus(500);
                          } else {
                              let restorani_tip = result1.rows;
                              pool.connect(function(err, client, done) {
                                  if (err) {
                                      res.end('{"error" : "Error", "status" : 500}');
                                  }
                                  client.query(`SELECT * FROM artikal_tip_lookup`,
                                      [], function(err, result2) {
                                          done();
                                          if (err) {
                                              console.info(err);
                                              res.sendStatus(500);
                                          } else {
                                              let artikli_tip = result2.rows;
                                              res.render('superadmin/superadmin_administracija_restorani.ejs', { title: naslov, korisnik: req.user, restorani: restorani, restorani_tip: restorani_tip, artikli_tip: artikli_tip });
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

//--------------------------------------------------Administracija uposlenika-----------------------------------------//

router.get('/posao', nije_autentificiran, adminplus, function(req, res, next) {
  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT * FROM restoran WHERE restoran_admin IS null`,
                [], function(err, result) {
      done();
      if (err) {
        console.info(err);
        res.sendStatus(500);
      } else {
          let view = '_administracija_uposlenici';
          if (req.user.korisnik_tip == 1)
              view = 'superadmin/superadmin' + view + '.ejs';
          else if (req.user.korisnik_tip == 2)
              view = 'admin/admin' + view + '.ejs';
          console.log(result.rows);
        res.render(view, { title: naslov, korisnik: req.user, restorani: result.rows });
      }
    });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Administracija specifičnog restorana------------------------------//

router.get('/restoran', nije_autentificiran, admin, function(req, res, next) {
  let admn = req.user.korisnik_id;
  let restoran = null;
  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT restoran_id FROM restoran WHERE restoran_admin = $1`,
        [admn], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
            restoran = result.rows[0].restoran_id;
            pool.connect(function(err, client, done) {
              if (err) {
                res.end('{"error" : "Error", "status" : 500}');
              }
              client.query(`
                            SELECT *
                            FROM artikal 
                            INNER JOIN artikal_tip_lookup 
                            ON artikal.artikal_tip = artikal_tip_lookup.artikal_tip_lookup_id
                            WHERE artikal.artikal_restoran = $1`,
                  [restoran], function(err, results) {
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
                                            SELECT *
                                            FROM artikal_tip_lookup
                                          `,
                                [], function(err, results1) {
                                    done();
                                    if (err) {
                                        console.info(err);
                                        res.sendStatus(500);
                                    } else {
                                        res.render('admin/admin_administracija_restoran.ejs', {korisnik: req.user, title: naslov, restoran: results.rows, tipovi: results1.rows});
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

//--------------------------------------------------Administracija grupnih menija restorana---------------------------//

router.get('/meniji', nije_autentificiran, admin, function(req, res, next) {
    var admn = req.user.korisnik_id;
    var restoran;
    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`SELECT restoran_id FROM restoran WHERE restoran_admin = $1`,
            [admn], function(err, result) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    restoran = result.rows[0].restoran_id;
                    pool.connect(function(err, client, done) {
                        if (err) {
                            res.end('{"error" : "Error", "status" : 500}');
                        }
                        client.query(`
                                        SELECT *
                                        FROM artikal 
                                        INNER JOIN artikal_tip_lookup 
                                        ON artikal.artikal_tip = artikal_tip_lookup.artikal_tip_lookup_id
                                        WHERE artikal.artikal_restoran = $1`,
                            [restoran], function(err, results) {
                                done();
                                if (err) {
                                    console.info(err);
                                    res.sendStatus(500);
                                } else {
                                    res.render('admin/admin_administracija_meniji.ejs', {korisnik: req.user, title: naslov, artikli: results.rows});
                                }
                            });
                    });
                }
            });
    });
});

//--------------------------------------------------------------------------------------------------------------------//




module.exports = router;
