const UserModel = require('../models/User');
const getUserId = require('../helpers/cognito');

const UserController = {
    find: async (req, res) => {
        let found = await UserModel.findById(req.params.id)
        .populate({
            path: "playlistsOwned",
            populate: [{ path: 'tracks' }, { path: 'themes' }, {path: 'creator'}],
            match: { private: {$ne: true}},
            options: { sort: { 'createdAt': -1 } }
        })
        .populate({
            path: "themesCreated",
            populate: [{ path: 'playlists', populate: [{ path: 'tracks' }, { path: 'themes' }, { path: 'creator'}] }, {path: 'creator'}],
            options: { sort: { 'createdAt': -1 } }
        });
        res.json(found);
    },
    all: async (req, res) => {
        let allUsers = await UserModel.find();
        res.json(allUsers);
    },
    create: async (req, res) => {
        await UserModel.findById(req.body.id).then(result => {
            if (result){
                res.status(400).json({success: false, message: 'User already exists'})
                return;
            }
        })
        let newUser = new UserModel({
            _id: req.body.id,
            username: req.body.username
        });
        newUser.save()
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.status(400).json({success: false, message: err.message})
            });
    },
    update: async (req, res) => {
        let found = await UserModel.findById(req.params.id);
        //check token is authorized
        let user = await getUserId(req.headers.accesstoken);
        if (user === undefined || user !== found._id){
            res.status(403).json({success: false, message: 'User not authorized.'})
            return;
        }
        found.username = req.body.username;
        found.avatar = req.body.avatar;
        found.save()
            .then(data => {
                res.json(data);
            })
            .catch(err => {
                res.status(400).json({success: false, message: err.message})
            });
    },
    getOwnedPlaylists: async (req, res) => {
        let found = await UserModel.findById(req.params.id)
        .populate({
            path: "playlistsOwned",
            populate: [{ path: 'tracks' }, { path: 'themes' }, {path: 'creator'}]
        });
        res.json(found);
    },
    getFollowedPlaylists: async (req, res) => {
        let found = await UserModel.findById(req.params.id)
        .populate({
            path: "playlistsFollowed",
            populate: [{ path: 'tracks' }, { path: 'themes' }, {path: 'creator'}]
        })
        res.json(found);
    },
    getPlaylists: async (req,res) => {
        let found = await UserModel.findById(req.params.id)
        .populate({
            path: "playlistsFollowed",
            populate: [{ path: 'tracks' }, { path: 'themes' }, {path: 'creator'}]
        })
        .populate('creator')
        .populate({
            path: "playlistsOwned",
            populate: [{ path: 'tracks' }, { path: 'themes' }, {path: 'creator'}],
            options: { sort: { 'createdAt': -1 } }
        });
        res.json(found);
    },
    getPlaylistsIdAndTitle: async (req,res) => {
        let found = await UserModel.findById(req.params.id)
        .populate("playlistsOwned", "_id title")
        res.json(found);
    },
}

module.exports = UserController;
