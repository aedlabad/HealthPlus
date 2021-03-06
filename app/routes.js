/*eslint-env node */
var Report = require('../app/models/report');
var User = require('../app/models/user');
module.exports = function(app, passport) {

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs'); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') });
    });

    // process the login form
    /*app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));*/

    app.post('/login', passport.authenticate('local-login', {failureRedirect: '/login',failureFlash: true}), function(req, res) {
      console.log(req.body.email);

      User.findOne({ 'local.email' :  req.body.email }, function(err, user) {
            //if there are any errors, return the error
                if (err) {
                    return done(err);
            }

            // check to see if theres already a user with that ID
            if (user) {
                console.log(user.local.email);
                console.log(user.local.userType);

                if (user.local.userType == "Doctor") {
                  console.log(user.local.userType);
                  res.redirect('/doctorProfile');
                }
                else if (user.local.userType == "Patient") {
                  console.log(user.local.userType);
                  res.redirect('/patientProfile');
                }
                else {
                  res.redirect('/login');
                }


            } else {
                //Delete the report object created if Patient is not found.
                res.redirect('/login');
            }
        });

      });


    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    app.get('/doctorReport', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('doctorReport.ejs', { message: req.flash('doctorForm') });
    });

    app.get('/doctorProfile', isLoggedIn, function(req, res) {
       res.render('doctorProfile.ejs', {
           user : req.user // get the user out of session and pass to template
       });
    });

    app.get('/patientProfile', isLoggedIn, function(req, res) {

      var newReport = new Report();
      Report.find({'patientID': req.user.local.userID}, 'firstName lastName age height weight symptoms medicines diagnosis specialization created_at' , function(err, reports) {
        if (reports) {
          //console.log('%s %s has symptoms %s ',report.firstName, report.lastName, report.symptoms)
          //console.log(req.params.id)
          res.render('patientProfile.ejs', {
            user : req.user,
           report : reports
          });
        }
        else {
          res.render('patientProfile.ejs', {
              user : req.user, // get the user out of session and pass to template
              report : newReport
          });
        }
      })
    });

    //var mongoose = require('mongoose');
    //var Report = mongoose.model('Report', reportSchema);



    app.get('/patientReport/:id/:key', isLoggedIn, function(req, res) {
        Report.find({'patientID': req.params.id}, 'firstName lastName age height weight symptoms medicines diagnosis specialization created_at' , function(err, report) {
          if (report) {
            //console.log('%s %s has symptoms %s ',report.firstName, report.lastName, report.symptoms)
            //console.log(req.params.id)
            res.render('patientReport.ejs', {
             report : report[req.params.key]
            });
          }
        })
    });

    app.get('/patientReportDel/:id/:key', isLoggedIn, function(req, res, done) {
        Report.find({'patientID': req.params.id}, 'firstName lastName age height weight symptoms medicines diagnosis specialization created_at' , function(err, report) {
          if (report) {
            //console.log('%s %s has symptoms %s ',report.firstName, report.lastName, report.symptoms)
            //console.log(req.params.id)
            report[req.params.key].remove( function (err) {
              if (err) throw err;
  // collection is now empty but not deleted
            });
            req.user.local.reportID.splice(req.params.key,1);
            req.user.save(function(err) {
                if (err)
                    throw err;
                return done(null, req.user);
            });

            res.render('patientProfile.ejs', {
             user: req.user
            });
          }
        })
    });
    /* // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    })); */

    app.post('/signup', passport.authenticate('local-signup', {failureRedirect: '/signup'}), function(req, res) {
      console.log(req.body.email);
      console.log(req.body.sel1);
      if (req.body.sel1 == "Doctor") {
        console.log(req.body.sel1);
        res.redirect('/doctorProfile');
      }
      else if (req.body.sel1 == "Patient") {
        console.log(req.body.sel1);
        res.redirect('/patientProfile');
      }
      else {
        res.redirect('/');
      }

    });

    /*app.post('/doctor', passport.authenticate('local-doctor', {
        successRedirect : '/doctor', // redirect to the secure profile section
    }));*/
    app.post('/doctorReport', function(req,res,done) {
      var newReport = new Report();
      newReport.firstName = req.body.firstName;
      newReport.lastName = req.body.lastName;
      newReport.patientID = req.body.patientID;
      newReport.age = req.body.age;
      newReport.height = req.body.height;
      newReport.weight = req.body.weight;
      newReport.symptoms = req.body.symptoms;
      newReport.medicines = req.body.medicines;
      newReport.diagnosis = req.body.diagnosis;
      newReport.specialization = req.body.specialization;
      newReport.created_at = Date();
      //newReport.save;
      User.findOne({ 'local.userID' :  req.body.patientID }, function(err, user) {
            //if there are any errors, return the error
            if(err) {
              console.log(err);
              res.send({
                message :'something went wrong'
              });
        }

            // check to see if theres already a user with that ID
            if (user) {
              newReport.save(function(err) {
                if (err)
                  throw err;
                return done(null,newReport);
              });
                user.local.reportID.push(newReport._id);
                user.save(function(err) {
                  if (err)
                    throw err;
                  return done(null,user);
                });

            } else {
                //Delete the report object created if Patient is not found.
            }
        });
      //res.status(200).end();
      //successRedirect : '/doctor' // redirect to the secure profile section
      res.render('doctorProfile.ejs', { message: req.flash('Report submitted successfully!') });

    });

    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
       res.render('profile.ejs', {
           user : req.user // get the user out of session and pass to template
       });
    });

   /*app.get('/profile', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('profile.ejs', { message: req.flash('signupMessage') });
    });*/


    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });
};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
