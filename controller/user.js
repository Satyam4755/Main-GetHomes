const { check } = require('express-validator');
const homes = require('../models/homes')
const User = require('../models/user');

// HOME PAGE
exports.homePage = async (req, res, next) => {
    let opacity = {};
    const registerHomes = await homes.find();

    let user = null;
    let showOptions = false;

    if (req.isLogedIn && req.session.user) {
        user = await User.findById(req.session.user._id);
        if (user.userType === 'guest') {
            showOptions = true;
            const favIds = user.favourites.map(fav => fav.toString());

            registerHomes.forEach(home => {
                opacity[home._id.toString()] = favIds.includes(home._id.toString()) ? 10 : 0;
            });
        } else {
            // logged-in but not a guest (e.g. host)
            registerHomes.forEach(home => {
                opacity[home._id.toString()] = 0;
            });
        }
    } else {
        // not logged-in at all
        registerHomes.forEach(home => {
            opacity[home._id.toString()] = 0;
        });
    }

    res.render('./store/home', {
        homes: registerHomes,
        title: "Home Page",
        opacity: opacity,
        currentPage: 'home',
        isLogedIn: req.isLogedIn,
        user:user || null,
        showOptions: showOptions // pass this to the EJS to toggle buttons
    });
};

// HOME DETAILS
exports.homeDetails = async (req, res, next) => {
    const homeId = req.params.homeId;
    const home = await homes.findById(homeId);
    let showOptions = false;
    if (!home) {
        return res.redirect('/user/home-list');
    }

    let opacity = {};
    if (req.isLogedIn && req.session.user) {

    const user = await User.findById(req.session.user._id);
        if (user.userType === 'guest') {
            showOptions = true;
            const user = await User.findById(req.session.user._id);
            const isFavourite = user.favourites.map(id => id.toString()).includes(home._id.toString());
            opacity[home._id.toString()] = isFavourite ? 10 : 0;
        }else{
            // logged-in but not a guest (e.g. host)
            opacity[home._id.toString()] = 0;
        }
    } 
    else {
        opacity[home._id.toString()] = 0;
    }

    res.render('./store/home-details', {
        home: home,
        title: "Home Details",
        opacity: opacity,
        isLogedIn: req.isLogedIn,
        user: req.session.user || null,
        showOptions: showOptions // pass this to the EJS to toggle buttons
    });
};

// FAVOURITE LIST
exports.favouriteList = async (req, res, next) => {
    if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

    const user = await User.findById(req.session.user._id).populate('favourites');
    res.render('./store/favourite_list', {
        homes: user.favourites,
        title: "favourite list",
        currentPage: 'favourite',
        isLogedIn: req.isLogedIn,
        user: req.session.user
    });
};

// ADD / REMOVE FAVOURITE
exports.postfavouriteList = async (req, res, next) => {
    if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

    const Id = req.body.homeId;
    const user = await User.findById(req.session.user._id);

    if (!user.favourites.includes(Id)) {
        user.favourites.push(Id);
    } else {
        user.favourites.pull(Id); 
    }

    await user.save();
    res.redirect('/user/favourite_list');
};

// UNFAVOURITE FROM FAV PAGE
exports.postUnfavourite = async (req, res, next) => {
    if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

    const homeId = req.params.homeId;
    const user = await User.findById(req.session.user._id);

    user.favourites.pull(homeId);
    await user.save();
    res.redirect('/user/favourite_list');
};

// BOOKING PAGE
exports.booking = (req, res, next) => {
    const homeId = req.params.homeId;
    homes.findById(homeId).then(home => {
        if (!home) {
            res.redirect('/user/home-list');
        } else {
            res.render('./store/booking', {
                home: home,
                title: "booking",
                isLogedIn: req.isLogedIn,
                currentPage: '',
                user: req.session.user || null
            });
        }
    });
};

// POST BOOKING
exports.Postbooking = [
    check('phone')
      .isNumeric()
      .withMessage('Phone number should be numeric')
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone number should be 10 digits long'),
      
    async (req, res, next) => {
      if (!req.isLogedIn || !req.session.user) return res.redirect('/login');
  
  
      const homeId = req.params.homeId;
      const { name, phone, checkin, checkout, payment } = req.body;
  
      try {
        const guestUser = await User.findById(req.session.user._id);
        const home = await homes.findById(homeId).populate('host');
  
        if (!home) {
          req.flash('error', 'Home not found');
          return res.redirect('back');
        }
  
        // Add to guest's reserved list if not already there
        if (!guestUser.reserved.includes(homeId)) {
          guestUser.reserved.push(homeId);
          await guestUser.save();
        }
  
        // Booking info to be sent to the host
        const booking = {
          guest: guestUser._id,
          home: home._id,
          name,
          phone,
          checkin,
          checkout,
          payment
        };
  
        const hostUser = await User.findById(home.host);
        hostUser.orders.push(booking);
        await hostUser.save();
  
        res.redirect('/user/submit_booking');
      } catch (err) {
        console.error('Booking Error:', err);
        req.flash('error', 'Something went wrong during booking');
        res.redirect('back');
      }
    }
  ];

// SUBMIT BOOKING PAGE
exports.submitBooking = (req, res, next) => {
    if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

    res.render('./store/submitBooking', {
        title: "submit booking",
        isLogedIn: req.isLogedIn,
        user: req.session.user
    });
};

// RESERVED LIST
exports.reserved = async (req, res, next) => {
    if (!req.isLogedIn || !req.session.user) return res.redirect('/login');

    const user = await User.findById(req.session.user._id).populate('reserved');
    res.render('./store/reserve', {
        homes: user.reserved,
        title: "Reserved Home list",
        currentPage: 'reserve',
        isLogedIn: req.isLogedIn,
        user: req.session.user
    });
};

// UNRESERVE
exports.Postreserved = async (req, res, next) => {
    if (!req.isLogedIn || !req.session.user) return res.redirect('/login');
  
    const homeId = req.params.homeId;
  
    try {
      // Remove home from guest's reserved list
      const user = await User.findById(req.session.user._id);
      user.reserved.pull(homeId);
      await user.save();
  
      // Find the home to get the host ID
      const home = await homes.findById(homeId);
      if (!home) {
        req.flash('error', 'Home not found');
        return res.redirect('/user/reserve');
      }
  
      // Remove corresponding order from host's orders
      await User.findByIdAndUpdate(home.host, {
        $pull: {
          orders: {
            guest: req.session.user._id,
            home: homeId
          }
        }
      });
  
      res.redirect('/user/reserve');
    } catch (err) {
      console.error('Error while unreserving home:', err);
      req.flash('error', 'Something went wrong while unreserving');
      res.redirect('/user/reserve');
    }
  };
