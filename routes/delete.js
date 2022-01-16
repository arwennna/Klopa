var express = require('express');
var router = express.Router();

//--------------------------------------------------Konfiguracija-----------------------------------------------------//
var passport = require('passport');
var pool = require('../konfig/konfig_baza');

var inicijaliziraj = require('../konfig/konfig_passport');
inicijaliziraj(passport);

var {
  nije_autentificiran,
  super_admin,
  admin
} = require('../funkcije/pomocne');

//--------------------------------------------------Brisanje restorana------------------------------------------------//
router.delete('/restoran/:id', nije_autentificiran, super_admin, function(req, res, next) {
  const id = req.params.id;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT * FROM restoran WHERE restoran_id = $1`,
        [id], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
            if (result.rows.length < 1) {
              res.redirect('/administracija/restorani');
            }
            console.log('ok');
            pool.connect(function(err, client, done) {
              if (err) {
                res.end('{"error" : "Error", "status" : 500}');
              }
              client.query(`DELETE FROM restoran WHERE restoran_id = $1`,
                  [id], function(err, results) {
                    done();
                    if (err) {
                      console.info(err);
                      res.sendStatus(500);
                    } else {
                      res.sendStatus(200);
                    }
                  });
            });
          }
        });
  });
});

//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Brisanje artikla--------------------------------------------------//

router.delete('/artikal/:id', nije_autentificiran, admin, async function(req, res, next) {
  const id = req.params.id;

  pool.connect(function(err, client, done) {
    if (err) {
      res.end('{"error" : "Error", "status" : 500}');
    }
    client.query(`SELECT * FROM artikal WHERE artikal_id = $1`,
        [id], function(err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(500);
          } else {
            if (result.rows.length < 1) {
              res.redirect('/administracija/restoran');
            }
              pool.connect(function(err, client, done) {
                if (err) {
                  res.end('{"error" : "Error", "status" : 500}');
                }
                client.query(`DELETE FROM artikal WHERE artikal_id = $1`,
                    [id], function(err, results) {
                      done();
                      if (err) {
                        console.info(err);
                        res.sendStatus(500);
                      } else {
                        res.sendStatus(200);
                      }
                    });
              });
          }
        });
  });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Brisanje tipa restorana-------------------------------------------//
router.delete('/restoran/tip/:id', nije_autentificiran, super_admin, function(req, res, next) {
    const id = req.params.id;

    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`SELECT * FROM restoran_tip_lookup WHERE restoran_tip_lookup_id = $1`,
            [id], function(err, result) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    if (result.rows.length < 1) {
                        res.redirect('/administracija/restorani');
                    }
                    pool.connect(function(err, client, done) {
                        if (err) {
                            res.end('{"error" : "Error", "status" : 500}');
                        }
                        client.query(`DELETE FROM restoran_tip_lookup WHERE restoran_tip_lookup_id = $1`,
                            [id], function(err, results) {
                                done();
                                if (err) {
                                    console.info(err);
                                    res.sendStatus(500);
                                } else {
                                    res.sendStatus(200);
                                }
                            });
                    });
                }
            });
    });
});
//--------------------------------------------------------------------------------------------------------------------//

//--------------------------------------------------Brisanje tipa artikla---------------------------------------------//
router.delete('/artikal/tip/:id', nije_autentificiran, super_admin, function(req, res, next) {
    const id = req.params.id;

    pool.connect(function(err, client, done) {
        if (err) {
            res.end('{"error" : "Error", "status" : 500}');
        }
        client.query(`SELECT * FROM artikal_tip_lookup WHERE artikal_tip_lookup_id = $1`,
            [id], function(err, result) {
                done();
                if (err) {
                    console.info(err);
                    res.sendStatus(500);
                } else {
                    if (result.rows.length < 1) {
                        res.redirect('/administracija/restorani');
                    }
                    pool.connect(function(err, client, done) {
                        if (err) {
                            res.end('{"error" : "Error", "status" : 500}');
                        }
                        client.query(`DELETE FROM artikal_tip_lookup WHERE artikal_tip_lookup_id = $1`,
                            [id], function(err, results) {
                                done();
                                if (err) {
                                    console.info(err);
                                    res.sendStatus(500);
                                } else {
                                    res.sendStatus(200);
                                }
                            });
                    });
                }
            });
    });
});
//--------------------------------------------------------------------------------------------------------------------//

module.exports = router;
