export const getPaginatedData = async (model, req) => {
    const limit = 10;
    const page = parseInt(req.query.page) || 1;

    const options = {
        page,
        limit,
        sort: '-createdAt',
        lean: true, // returns plain JS objects
        select: 'name price images category status ratings reviews', // only fetch necessary fields
        populate: {
            path: "reviews",
            select: "productId productName productImage userId email userName userImage rating comment approved createdAt", // specify fields to keep payload lean
        },
    };

    return await model.paginate({}, options);
}
// for admin orders
export const getPaginatedOrderData = async (model, req) => {
    const limit = Number(req.query.limit) || 10;
    const page = Number(req.query.page) || 1;

    const options = {
        page,
        limit,
        sort: { createdAt: -1 },
        lean: true,
        leanWithId: false,
        select: '',
    };

    return await model.paginate({}, options);
};



export const getPaginatedDataFilter = async (model, req, filter) => {
    const limit = Number(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;

    const options = {
        page,
        limit,
        sort: '-createdAt',
        lean: true,
        leanWithId: false,
        // Keep public listing payload small. Product reviews should be fetched
        // on product detail pages, not on the homepage/listing response.
        select: 'name price images category status ratings',
    };

    return await model.paginate(filter, options);
}
