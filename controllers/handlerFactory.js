const CatchAsync = require('../utils/CatchAsync')
const AppError = require('../utils/AppError')
const APIFeatures = require('../utils/APIFeatures')

exports.deleteOne = (Model) =>
    CatchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndDelete(req.params.id)

        if (!doc)
            return next(new AppError('No document found with that id', 404))

        res.status(204).json({
            status: 'success',
            data: null,
        })
    })

exports.updateOne = (Model) =>
    CatchAsync(async (req, res, next) => {
        const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        })

        if (!doc) {
            return next(new AppError('No document found with that id', 404))
        }

        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        })
    })

exports.createOne = (Model) =>
    CatchAsync(async (req, res, next) => {
        const doc = await Model.create(req.body)

        res.status(201).json({
            status: 'success',
            data: {
                data: doc,
            },
        })
    })

exports.getOne = (Model, popOptions) =>
    CatchAsync(async (req, res, next) => {
        const query = Model.findById(req.params.id)
        if (popOptions) query.populate(popOptions)

        const doc = await query

        if (!doc)
            return next(new AppError('No document found with that id', 404))

        res.status(200).json({
            status: 'success',
            data: {
                data: doc,
            },
        })
    })

exports.getAll = (Model) =>
    CatchAsync(async (req, res, next) => {
        // to allow for nested get reviews on tour
        let filter = {}
        if (req.params.tourId) filter = { tour: req.params.tourId }

        // Build query
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate()

        features.query = features.query

        // Execute query
        // const doc = await features.query.explain()
        const doc = await features.query

        res.status(200).json({
            status: 'success',
            length: doc.length,
            data: {
                data: doc,
            },
        })
    })
