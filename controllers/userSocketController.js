const User = require('../model/User');

const emitError = (socket, error) => {
    socket.emit('connect_request_failed', { error });
    console.log(error)
};

const sendConnectRequest = async (data, socket) => {
    try {
        const { userId } = socket;
        const { id: receiverId, cb } = data;

        // Validate userId and receiverId here

        const reqSender = await User.findById(userId).exec();
        const reqReceiver = await User.findById(receiverId).exec();

        if (!reqSender || !reqReceiver) {
            return emitError(socket, "Invalid user(s) or user doesn't exist");
        }

        const requestExists = reqReceiver.connections.some(conn => conn.user.equals(userId));

        if (requestExists) {
            console.log(receiverId)
            console.log(userId)
            await User.updateOne(
                {
                    _id: userId
                },
                {
                    $pull: {
                        sentRequest: {
                            user: receiverId,
                        }
                    }
                }
            )

            await User.updateOne(
                {
                    _id: receiverId,
                },
                {
                    $pull: {
                        connections: {
                            user: userId,
                        }
                    }
                }
            )

            // if connected, remove from the connection list of sender
            await User.updateOne(
                {
                    _id: userId
                },
                {
                    $pull: {
                        connections: {
                            user: receiverId,
                        }
                    }
                }
            )

            socket.to(receiverId).emit('remove_connect_req', { status: 200 });
            cb({ status: 200, message: 'Successfully removed request', action: 'DELETE' });
        } else {
            reqReceiver.connections.push({ user: userId });
            reqSender.sentRequest.push({ user: receiverId });

            const isFollower = reqReceiver.followers.some(user => user.equals(userId));
            if (!isFollower) {
                reqReceiver.followers.push(userId);
            }

            await reqReceiver.save();
            await reqSender.save();

            socket.to(receiverId).emit('receive_connect_req', { status: 200 }); // connections are fetched again in frontend
            cb({ status: 200, message: 'Request sent successfully', action: 'ADD' });
        }

    } catch (e) {
        emitError(socket, e.message);
        data.cb({ status: 500, message: 'Error occurred', action: 'ERROR' }); // Handle error in the callback
    }
};

const getConnectStatus = async (data, socket) => {
    try {
        const { id, cb } = data;
        const { userId } = socket;

        // Validate userId and id here

        const foundUser = await User.findById(id).exec();

        if (!foundUser) {
            return emitError(socket, "Requested user doesn't exist");
        }

        const status = foundUser.connections.find(conn => conn.user.equals(userId));

        cb({ status: 200, data: status?.status || 'not-connected' });


    } catch (e) {
        emitError(socket, e.message);
        data.cb({ status: 500, message: 'Error occurred', data: null });
    }
};

const responseConnectRequest = async (data, socket) => {
    try {
        const { connectId, action, cb } = data;
        const { userId } = socket;

        // Validate userId, connectId, and action here

        const reqReceiver = await User.findById(userId).exec();

        if (!reqReceiver) {
            return emitError(socket, "Requested user doesn't exist");
        }

        const foundConnectRequest = reqReceiver.connections.find(conn => conn._id.equals(connectId));

        if (!foundConnectRequest) {
            return emitError(socket, "Haven't requested yet!");
        }

        const reqSender = foundConnectRequest.user.toString();
        console.log(reqSender)

        if (action === 'ADD') {
            await User.updateOne(
                { _id: userId, 'connections._id': connectId },
                { $set: { 'connections.$.status': 'connected' } }
            );

            await User.updateOne(
                { _id: reqSender },
                {
                    $push: {
                        'connections': {
                            user: userId,
                            status: 'connected'
                        }
                    }
                }
            );

            cb({ status: 200, message: 'Added to connection' });
        } else if (action === 'DELETE') {
            const updated1 = await User.findOneAndUpdate(
                { _id: userId },
                { $pull: { 'connections': { user: reqSender } } },
                { new: true }
            );

            // if connected, remove the connection from both end
            const updated2 = await User.findOneAndUpdate(
                { _id: reqSender },
                { $pull: { 'connections': { user: userId } } },
                { new: true }
            );

            // console.log(updated1, updated2)

            cb({ status: 200, message: 'Connection pending removed' });
        }

        await User.updateOne(
            { _id: reqSender },
            { $pull: { sentRequest: { user: userId } } }
        );

        const status = action === 'ADD' ? 'connected' : 'not-connected';
        socket.to(foundConnectRequest.user.toString()).emit('refresh_connect_status', status);
    } catch (e) {
        emitError(socket, e.message);
        data.cb({ status: 500, message: 'Error occurred', action: 'ERROR' });
    }
};

const sendMessage = async (data, socket) => {
    const emitErr = (msg, status) => {
        socket.emit('msg_error', { message: msg, status })
    }

    try {
        const { id, text, cb } = data;
        if (!id) return emitErr('Empty argument, id not passed', 400)

        const { userId } = socket;

        const sender = await User.findById(userId).exec();
        const receiver = await User.findById(id).exec();

        if (!sender || !receiver) return emitErr('Invalid user(s) or not found', 404)

        // await User.updateMany({}, { 'conversations.latestMessage': {} }).exec()

        // updating sender
        const senderMsg = await User.findOneAndUpdate(
            {
                _id: userId,
                'conversations.user': id, // Match the user within the conversations array
            },
            {
                $push: {
                    'conversations.$.messages': { // Use the $ positional operator to update the correct conversation
                        self: true,
                        text,
                    },
                },
                $set: {
                    'conversations.$.latestMessage': {
                        self: true,
                        text,
                        createdAt: new Date(), // Add the creation timestamp
                    },
                },
            },
            {
                new: true,
            }
        );


        // updating receiver
        const receiverMsg = await User.findOneAndUpdate(
            {
                _id: id,
                'conversations.user': userId,
            },
            {
                $push: {
                    'conversations.$.messages': {
                        self: false,
                        text,
                    },
                },
                $set: {
                    'conversations.$.latestMessage': {
                        self: false,
                        text,
                        createdAt: new Date(),
                    },
                },
            },
            {
                new: true,
            }
        );

        // this may not be the proper way to get the latest pushed message
        const latestSenderMessage = senderMsg.conversations.find(conv => conv.user.equals(id)).messages.slice(-1)[0];
        const latestReceiverMessage = receiverMsg.conversations.find(conv => conv.user.equals(userId)).messages.slice(-1)[0];

        cb({ stats: 200, message: 'Successfully send', data: latestSenderMessage });

        socket.to(id).emit('receive_msg', latestReceiverMessage)
        socket.to(userId).emit('update') // to refetch on sidebar_chat
        socket.to(id).emit('update') // to refetch on sidebar_chat


    } catch (e) {
        emitError(socket, e.message)
        data.cb({ status: 500, message: 'Error occurred', action: 'ERROR' });
    }
}

module.exports = { sendConnectRequest, getConnectStatus, responseConnectRequest, sendMessage };
