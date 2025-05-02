const cloudinary = require('cloudinary').v2;
const homes = require('../models/homes');
const fs = require('fs');
const fsPromises = require('fs/promises');
const { fileUploadInCloudinary } = require('../utils/cloudinary');

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
        return res.redirect('/host/addHomes');
    }

    const imageFilePath = files.image[0].path;
    const pdfFilePath = files.rules[0].path;

    let imageResult, pdfResult;

    try {
        imageResult = await fileUploadInCloudinary(imageFilePath);
        pdfResult = await fileUploadInCloudinary(pdfFilePath, { resource_type: 'raw' });

        if (!imageResult?.secure_url || !pdfResult?.secure_url) {
            throw new Error("Cloudinary upload failed");
        }

        const Home = new homes({
            id,
            image: imageResult.secure_url,
            imagePublicId: imageResult.public_id, // ✅ Save public ID
            rules: pdfResult.secure_url,
            rulesPublicId: pdfResult.public_id,   // ✅ Save public ID
            Name,
            Type,
            Price,
            Location,
            Description,
            Rating,
            host: req.session.user._id
        });

        await Home.save();
        res.redirect('/host/admin_HomeList');
    } catch (err) {
        console.log("Error during home upload:", err.message);
        res.redirect('/host/addHomes');
    } finally {
        try { if (imageFilePath) await fsPromises.unlink(imageFilePath); } catch (err) {
            console.log("Failed to delete image:", err.message);
        }
        try { if (pdfFilePath) await fsPromises.unlink(pdfFilePath); } catch (err) {
            console.log("Failed to delete PDF:", err.message);
        }
    }
};

// Post edit home

exports.PosteditHome = async (req, res) => {
    const {Name, Type, Price, Location, Description, Rating } = req.body;
    const homeId =req.body.id;
    const files=req.files;

    try {
        const home = await homes.findById(homeId);
        if (!home || home.host.toString() !== req.session.user._id.toString()) {
            console.log("unauthorized");
            return res.status(403).send("<h1>unauthorized</h1>");
        }

        // Handle image update
        // IMAGE update
if (files && files.image) {
    if (home.imagePublicId) {
        await cloudinary.uploader.destroy(home.imagePublicId).catch(err => {
            console.log("Error while deleting image from Cloudinary:", err.message);
        });
    }

    const imageLocalPath = files.image[0].path;
    const imageResult = await fileUploadInCloudinary(imageLocalPath);

    if (!imageResult?.secure_url) {
        throw new Error("Image upload failed");
    }

    home.image = imageResult.secure_url;
    home.imagePublicId = imageResult.public_id; // ✅ update public ID
}

// PDF update
if (files && files.rules) {
    if (home.rulesPublicId) {
        await cloudinary.uploader.destroy(home.rulesPublicId, { resource_type: 'raw' }).catch(err => {
            console.log("Error while deleting PDF from Cloudinary:", err.message);
        });
    }

    const pdfLocalPath = files.rules[0].path;
    const pdfResult = await fileUploadInCloudinary(pdfLocalPath, { resource_type: 'raw' });

    if (!pdfResult?.secure_url) {
        throw new Error("PDF upload failed");
    }

    home.rules = pdfResult.secure_url;
    home.rulesPublicId = pdfResult.public_id; // ✅ update public ID
}
        // Update other fields

        home.Name = Name;
        home.Type = Type;
        home.Price = Price;
        home.Location = Location;
        home.Description = Description;
        home.Rating = Rating;

        await home.save();
        res.redirect('/host/admin_HomeList');

    } catch (error) {
        console.log("Error during post edit:", error.message);
        res.redirect('/host/admin_HomeList');
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

