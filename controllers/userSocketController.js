const User = require('../model/User')

const sendConnectRequest = async (e, socket) => {
    try {
        const { userId } = socket;
        const { id: data, cb } = e
        const receiverId = data;
        // console.log('receiverid = ', receiverId)

        const req_sender = await User.findById(userId).exec();
        if (!req_sender) return socket.emit('connect_request_failed', { error: 'Unauthorized' });

        const req_receiver = await User.findById(receiverId).exec();
        if (!req_receiver) return socket.emit('connect_request_failed', { error: "Requested user doesn't exist" });

        const requestExists = req_receiver.connections.some(conn => conn.user.equals(userId))

        if (requestExists) return socket.emit('connect_request_failed', { error: "Already requested" });

        const sendReq = {

            user: userId,
            status: 'pending',

        }

        req_receiver.connections.push(sendReq)

        await req_receiver.save();

        socket.to(receiverId).emit('receive_connect_req', sendReq)
        cb({ status: 200, message: 'Request sent successfully' })

        // socket.emit()

    } catch (e) {
        socket.emit('connect_request_failed', { error: e.message })
    }
}

module.exports = { sendConnectRequest }