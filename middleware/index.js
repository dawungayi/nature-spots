// all the middleware for our app goes here

const Adventure = require("../models/adventure");
const Review = require("../models/review");

let middlewareObj = {};

// middleware to check for authorization for adventures edit, update and destroy routes
// make sure user can only edit/delete adventures that they created.
middlewareObj.checkAdventureOwnership = function(req, res, next) {
    /// is user logged in?
    if(req.isAuthenticated()) {
        console.log("User logged in successfully");
        Adventure.findById(req.params.id, (err, foundAdventure) => {
            if(err) {
                console.log(err);
                req.flash("error", "Adventure not found in the database");
                res.redirect("back");
            } else {
                // console.log(foundAdventure);
                /// does user own adventure
                /*
                    Even though both req.user._id and foundAdventure.author.id appear to be the same when displayed on the console, they are not. 
                    Both are of type object, but do not equal each other.
                    Hence we cannot compare them using === or ==. That is, the following does not work - it will never evaluate to true 
                    if(req.user._id == foundAdventure.author.id) { 
                    We have to use the .equals() method from mongoose:
                    if(foundAdventure.author.id.equals(req.user._id)) { 
                        make sure the document found is on the left hand side, and req.user._id is on the right
                */
                // console.log(req.user._id, typeof(req.user._id));  debug
                // console.log(foundAdventure.author.id, typeof(foundAdventure.author.id));   debug

                if(foundAdventure.author.id.equals(req.user._id)) { 
                    console.log("User is Authorized to do this action.");
                    // pass the foundAdventure to next() using req - similar to how bodyParser attaches body property to request object 
                    // Thanks to Farid's answer: https://stackoverflow.com/a/23965964/12008034
                    // make sure no other library uses this property - foundAdventure - so there's no conflicts within the objects in req
                    req.foundAdventure = foundAdventure;
                    next();
                } else {
                    console.log("AUTHORIZATION ERROR");
                    console.log(`You - ${req.user.username} -  do not have permissions to edit/delete since you don't own the adventure. Adventure is owned by ${foundAdventure.author.username}`);
                    req.flash("error", "Authorization Error. You don't have permission to do that.");
                    res.redirect("back");
                }
            }  // end else findById no error
        }); // end of .findbyId callback
    } else {
        // user is not logged in
        // if user is not authenticated, don't allow access and redirect to the login page
        console.log("LOGIN FIRST - You need to be logged in to perform that action.");
        // do it before you redirect - it shows up on the page you redirect to
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("back");   // take the user back to previous page they were on
    }
}   // end of checkAdventureOwnership

// middleware to check for authorization for review edit, update and destroy routes
// make sure user can only edit/delete reviews that they created.
middlewareObj.checkReviewOwnership = async function(req, res, next) {
    if(req.isAuthenticated()) {
        try {
            let foundReview = await Review.findById(req.params.review_id);
            if(foundReview.author.id.equals(req.user._id)) {
                console.log("User is Authorized to do this action.");
                next();
            } else {
                console.log("AUTHORIZATION ERROR");
                console.log(`You - ${req.user.username} -  do not have permissions to edit/delete since you don't own this review. Review is owned by ${foundReview.author.username}`);
                req.flash("error", "Authorization Error. You don't have permission to do that.");
                res.redirect("back");
            }

        } catch (error) {
            // error from promise reject - findById error - DB error. We'll hardly ever see this if server is up and running
            req.flash("error", "Review not found in the database");
            console.log(error);
            res.redirect("back");   // take the user back to previous page they were on
        }

    } else {
        // user is not logged in
        // if user is not authenticated, don't allow access and redirect to the login page
        console.log("LOGIN FIRST - You need to be logged in to perform that action.");
        // do it before you redirect - it shows up on the page you redirect to
        req.flash("error", "You need to be logged in to do that.");
        res.redirect("back");   // take the user back to previous page they were on
    }
}   // end of checkReviewOwnership

// middleware to implement authentication - checks if a user is logged in
middlewareObj.isLoggedIn = function(req, res, next) {
    
    if(req.isAuthenticated()){
        console.log("User is authenticated, and good to go");
        return next();  
    }
    // if user is not authenticated, don't allow access and redirect to the login page
    console.log("LOGIN FIRST - You need to be logged in to perform that action.");
    // do it before you redirect - it shows up on the page you redirect to
    req.flash("error", "You need to be logged in to do that.");
    res.redirect("/login");

}  // end of isLoggedIn

module.exports = middlewareObj;
