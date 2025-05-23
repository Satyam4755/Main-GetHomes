const cloudinary = require('cloudinary').v2;
const homes = require('../models/homes');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { fileUploadInCloudinary } = require('../utils/cloudinary');
const User = require('../models/user');

// host
exports.hostPage = (req, res, next) => {
    res.render('./admin/host', { 
        title: "Host Page",
        isLogedIn: req.isLogedIn,
        user: req.session.user
    });
};

// add home
exports.addHome = (req, res, next) => {
    res.render('./admin/editHomes', { 
        editing: false,
        title: "Add Home details",
        currentPage: 'admin',
        isLogedIn: req.isLogedIn,
        user: req.session.user
    });
};

// get edit home
exports.editHome = (req, res, next) => {
    const homeId = req.params.homeId;
    const editing = req.query.editing === 'true';

    homes.findById(homeId).then(home => {
        if (!home) {
            console.log("Home not found");
            return res.redirect('/host/admin_HomeList');
        }

        console.log("Home host:", home.host); // ✅ Now it's a real value

        res.render('./admin/editHomes', {
            home: home,
            editing: editing,
            title: "Edit Home details",
            currentPage: 'admin',
            isLogedIn: req.isLogedIn,
            user: req.session.user
        });
    });
};

// admin home list
exports.adminHomeList = async (req, res, next) => {
    const hostId = req.session.user._id;
    const hostHomes = await homes.find({ host: hostId }).populate('host');
    res.render('./admin/admin_homeList', {
        homes: hostHomes,
        title: "Admin HomeList Page",
        currentPage: 'adminHome',
        isLogedIn: req.isLogedIn,
        user: req.session.user
    });
};

exports.postAddHome = async (req, res) => {
    const { id, Name, Type, Price, Location, Description, Rating } = req.body;
    const files = req.files;

    if (!files || !files.image || !files.rules) {
        console.log("One or more required files are missing or not valid");
        return res.status(400).json({ success: false, message: "Missing image or rules file" });
    }

    try {
        const imageBuffer = files.image[0].buffer;
        const pdfBuffer = files.rules[0].buffer;

        const imageResult = await fileUploadInCloudinary(imageBuffer);
        const pdfResult = await fileUploadInCloudinary(pdfBuffer, { resource_type: 'raw' });

        if (!imageResult?.secure_url || !pdfResult?.secure_url) {
            throw new Error("Cloudinary upload failed");
        }

        const Home = new homes({ 
            id,
            image: imageResult.secure_url,
            imagePublicId: imageResult.public_id,
            rules: pdfResult.secure_url,
            rulesPublicId: pdfResult.public_id,
            Name,
            Type,
            Price,
            Location,
            Description,
            Rating,
            host: req.session.user._id
        });

        await Home.save();

        return res.status(200).json({ success: true, message: "Home added successfully" });
    } catch (err) {
        console.error("Error during home upload:", err.message);
        return res.status(500).json({ success: false, message: "Internal server error: " + err.message });
    }
};

// Post edit home

exports.PosteditHome = async (req, res) => {
    const { Name, Type, Price, Location, Description, Rating, id: homeId } = req.body;
    const files = req.files;

    try {
        const home = await homes.findById(homeId);
        if (!home || home.host.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized to edit this home" });
        }

        // ✅ IMAGE update
        if (files?.image) {
            if (home.imagePublicId) {
                await cloudinary.uploader.destroy(home.imagePublicId).catch(err => {
                    console.warn("Error deleting old image:", err.message);
                });
            }

            const imageBuffer = files.image[0].buffer;
            const imageResult = await fileUploadInCloudinary(imageBuffer);

            if (!imageResult?.secure_url) {
                throw new Error("Image upload failed");
            }

            home.image = imageResult.secure_url;
            home.imagePublicId = imageResult.public_id;
        }

        // ✅ PDF update
        if (files?.rules) {
            if (home.rulesPublicId) {
                await cloudinary.uploader.destroy(home.rulesPublicId, { resource_type: 'raw' }).catch(err => {
                    console.warn("Error deleting old PDF:", err.message);
                });
            }

            const pdfBuffer = files.rules[0].buffer;
            const pdfResult = await fileUploadInCloudinary(pdfBuffer, { resource_type: 'raw' });

            if (!pdfResult?.secure_url) {
                throw new Error("PDF upload failed");
            }

            home.rules = pdfResult.secure_url;
            home.rulesPublicId = pdfResult.public_id;
        }

        // ✅ Update other fields
        home.Name = Name;
        home.Type = Type;
        home.Price = Price;
        home.Location = Location;
        home.Description = Description;
        home.Rating = Rating;

        await home.save();
        return res.status(200).json({ success: true, message: "Home updated successfully" });

    } catch (error) {
        console.error("Error during home update:", error.message);
        return res.status(500).json({ success: false, message: "Internal server error: " + error.message });
    }
};
// dikkat in postEdithomes
// delete home
// delete nhi ho rha hai cloudinary se*************
exports.deleteHome = async (req, res, next) => {
    const homeId = req.params.homeId;

    try {
        const home = await homes.findById(homeId);
        if (!home) {
            return res.status(404).send("Home not found");
        }

        if (home.host.toString() !== req.session.user._id.toString()) {
            return res.status(403).send('Unauthorized');
        }

        const cloudinaryDeletePromises = [];

        if (home.imagePublicId) {
            cloudinaryDeletePromises.push(cloudinary.uploader.destroy(home.imagePublicId));
        }

        if (home.rulesPublicId) {
            cloudinaryDeletePromises.push(cloudinary.uploader.destroy(home.rulesPublicId, { resource_type: 'raw' }));
        }

        await Promise.all(cloudinaryDeletePromises);
        await homes.findByIdAndDelete(homeId);

        res.redirect('/host/admin_HomeList');
    } catch (err) {
        console.log(err);
        res.redirect('/host/admin_HomeList');
    }
};

exports.getOrders = async (req, res, next) => {
    if (!req.isLogedIn || !req.session.user) return res.redirect('/login');
  
    try {
      const host = await User.findById(req.session.user._id)
        .populate('orders.guest', 'email') // Populate guest details (only name/email)
        .populate('orders.home', 'Name Location'); // Populate home details (optional fields)
  
      res.render('./admin/orders', {
        title: "Orders",
        isLogedIn: req.isLogedIn,
        user: req.session.user,
        orders: host.orders, // Pass orders to the EJS
        currentPage: 'orders'
    });
    } catch (err) {
      console.error('Error fetching host orders:', err);
      req.flash('error', 'Could not load orders');
      res.redirect('back');
    }
  };

