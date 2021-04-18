const generateMessages = (text,username) => {
    return {
        text,
        createdAt: new Date().getTime(),
        username
    }
}

const generatedLocationMessage = (url,username) => {
    return {
        url,
        createdAt: new Date().getTime(),
        username
    }
}

module.exports = {
    generateMessages,
    generatedLocationMessage
}